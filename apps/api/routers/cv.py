from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import json
import httpx

from database import get_db
from auth import get_current_admin
from models import (
    CVDocument, CVChunk,
    Profile, Skill, Experience, Education, Certificate, Achievement, SocialLink,
)
from schemas import CVStatus, CVImportResult, LinkedInSyncRequest
from config import settings

router = APIRouter(prefix="/admin/cv", tags=["cv"])


# ── PDF parsing ────────────────────────────────────────────────────────────────

def parse_pdf(file_bytes: bytes) -> str:
    import fitz
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = [page.get_text() for page in doc]
    doc.close()
    return "\n\n".join(pages)


# ── Claude extraction ──────────────────────────────────────────────────────────

async def claude_extract(cv_text: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""Parse this CV and return ONLY valid JSON (no markdown fences, no explanation).

CV:
{cv_text[:12000]}

JSON structure required:
{{
  "profile": {{
    "name": "...", "tagline": "Short professional title", "bio": "2-3 sentence summary",
    "email": "...", "phone": "...", "location": "City, Country", "open_to_work": true
  }},
  "skills": [
    {{"name": "Python", "category": "Languages", "proficiency": 90}},
    {{"name": "TensorFlow", "category": "AI / ML", "proficiency": 85}}
  ],
  "experiences": [
    {{
      "company": "...", "role": "...", "description": "...",
      "start_date": "Jan 2022", "end_date": "Dec 2023", "is_current": false,
      "location": "...", "technologies": ["Python", "AWS"]
    }}
  ],
  "education": [
    {{
      "institution": "...", "degree": "B.E. Computer Science", "field": "...",
      "start_date": "2019", "end_date": "2023", "gpa": null
    }}
  ],
  "certificates": [
    {{"title": "...", "issuer": "...", "issued_date": "2023", "category": "AI / ML"}}
  ],
  "achievements": [
    {{"title": "...", "description": "...", "date": "2023", "icon": "🏆"}}
  ]
}}

Rules:
- Skill proficiency: estimate 70-95 based on depth of usage described
- Skill categories: "AI / ML", "Full Stack", "iOS", "DevOps", "Languages", "Cloud", "Tools"
- Return ONLY the JSON object, nothing else"""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Chunking + embedding ───────────────────────────────────────────────────────

def chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start: start + size])
        start += size - overlap
    return chunks


async def embed_texts(texts: list[str]) -> list[list[float]] | None:
    if not settings.OPENAI_API_KEY:
        return None
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.embeddings.create(
        model="text-embedding-3-small",
        input=[t[:8000] for t in texts],
    )
    return [d.embedding for d in resp.data]


# ── DB population ──────────────────────────────────────────────────────────────

def populate_db(db: Session, data: dict) -> CVImportResult:
    result = CVImportResult()

    p = data.get("profile") or {}
    if p.get("name"):
        existing = db.query(Profile).first()
        if existing:
            for k, v in p.items():
                if hasattr(existing, k) and v is not None:
                    setattr(existing, k, v)
        else:
            db.add(Profile(**{k: v for k, v in p.items() if hasattr(Profile, k)}))
            result.profiles_created = 1
        db.flush()

    for s in data.get("skills") or []:
        if s.get("name") and s.get("category"):
            db.add(Skill(
                name=s["name"],
                category=s["category"],
                proficiency=max(0, min(100, int(s.get("proficiency", 80)))),
                display_order=result.skills_created,
            ))
            result.skills_created += 1
    db.flush()

    for e in data.get("experiences") or []:
        if e.get("company") and e.get("role"):
            db.add(Experience(
                company=e["company"], role=e["role"],
                description=e.get("description"),
                start_date=e.get("start_date"), end_date=e.get("end_date"),
                is_current=bool(e.get("is_current")),
                location=e.get("location"),
                technologies=e.get("technologies") or [],
                display_order=result.experiences_created,
            ))
            result.experiences_created += 1
    db.flush()

    for edu in data.get("education") or []:
        if edu.get("institution") and edu.get("degree"):
            db.add(Education(
                institution=edu["institution"], degree=edu["degree"],
                field=edu.get("field"),
                start_date=edu.get("start_date"), end_date=edu.get("end_date"),
                gpa=edu.get("gpa"),
                display_order=result.education_created,
            ))
            result.education_created += 1
    db.flush()

    for c in data.get("certificates") or []:
        if c.get("title") and c.get("issuer"):
            db.add(Certificate(
                title=c["title"], issuer=c["issuer"],
                issued_date=c.get("issued_date"),
                category=c.get("category"),
                display_order=result.certificates_created,
            ))
            result.certificates_created += 1
    db.flush()

    for a in data.get("achievements") or []:
        if a.get("title"):
            db.add(Achievement(
                title=a["title"], description=a.get("description"),
                date=a.get("date"), icon=a.get("icon", "🏆"),
                display_order=result.achievements_created,
            ))
            result.achievements_created += 1

    db.commit()
    return result


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("", response_model=CVStatus)
def get_cv_status(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    cv = db.query(CVDocument).filter_by(is_active=True).first()
    if not cv:
        return CVStatus(has_cv=False)
    total = db.query(CVChunk).filter_by(document_id=cv.id).count()
    embedded = db.query(CVChunk).filter(
        CVChunk.document_id == cv.id, CVChunk.embedding.isnot(None)
    ).count()
    return CVStatus(
        has_cv=True, filename=cv.filename, uploaded_at=cv.uploaded_at,
        chunks_count=total, has_embeddings=embedded > 0,
    )


@router.post("/upload", response_model=CVImportResult)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(400, "ANTHROPIC_API_KEY is not configured on the server")
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    content = await file.read()
    try:
        raw_text = parse_pdf(content)
    except Exception as e:
        raise HTTPException(400, f"Could not parse PDF: {e}")

    # Deactivate previous CV
    db.query(CVDocument).update({"is_active": False})
    cv_doc = CVDocument(filename=file.filename, raw_text=raw_text, is_active=True)
    db.add(cv_doc)
    db.commit()
    db.refresh(cv_doc)

    try:
        extracted = await claude_extract(raw_text)
    except Exception as e:
        raise HTTPException(500, f"AI extraction failed: {e}")

    result = populate_db(db, extracted)

    # Chunk + embed
    texts = chunk_text(raw_text)
    embeddings = await embed_texts(texts)
    for i, text in enumerate(texts):
        db.add(CVChunk(
            document_id=cv_doc.id,
            chunk_text=text,
            chunk_index=i,
            embedding=embeddings[i] if embeddings else None,
        ))
    db.commit()

    result.chunks_embedded = len(texts) if embeddings else 0
    result.message = (
        f"Extracted {result.skills_created} skills, "
        f"{result.experiences_created} experiences, "
        f"{result.education_created} education records, "
        f"{result.certificates_created} certificates"
    )
    return result


@router.post("/linkedin")
async def sync_linkedin(
    body: LinkedInSyncRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    url = body.linkedin_url.strip()

    # Always save/update as social link
    existing = db.query(SocialLink).filter_by(platform="LinkedIn").first()
    if existing:
        existing.url = url
    else:
        db.add(SocialLink(platform="LinkedIn", url=url, icon="linkedin", display_order=0))
    db.commit()

    if not settings.PROXYCURL_API_KEY:
        return {
            "status": "partial",
            "message": "LinkedIn URL saved as social link. Set PROXYCURL_API_KEY on Render to enable full profile sync.",
            "proxycurl_required": True,
        }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            "https://nubela.co/proxycurl/api/v2/linkedin",
            params={
                "linkedin_profile_url": url,
                "skills": "include",
                "education": "include",
                "experiences": "include",
                "certifications": "include",
            },
            headers={"Authorization": f"Bearer {settings.PROXYCURL_API_KEY}"},
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"Proxycurl error {resp.status_code}: {resp.text[:300]}")

    li = resp.json()

    def _date(obj, field="starts_at"):
        d = (obj or {}).get(field) or {}
        m, y = d.get("month", ""), d.get("year", "")
        if y:
            return f"{m}/{y}" if m else str(y)
        return None

    data = {
        "profile": {
            "name": f"{li.get('first_name', '')} {li.get('last_name', '')}".strip() or None,
            "tagline": li.get("headline"),
            "bio": li.get("summary"),
            "location": li.get("city") or li.get("country_full_name"),
        },
        "skills": [{"name": s, "category": "General", "proficiency": 80} for s in (li.get("skills") or [])[:30]],
        "experiences": [
            {
                "company": e.get("company"), "role": e.get("title"),
                "description": e.get("description"),
                "start_date": _date(e, "starts_at"),
                "end_date": _date(e, "ends_at"),
                "is_current": e.get("ends_at") is None,
                "technologies": [],
            }
            for e in (li.get("experiences") or [])
        ],
        "education": [
            {
                "institution": e.get("school"), "degree": e.get("degree_name"),
                "field": e.get("field_of_study"),
                "start_date": str((e.get("starts_at") or {}).get("year", "")) or None,
                "end_date": str((e.get("ends_at") or {}).get("year", "")) or None,
            }
            for e in (li.get("education") or [])
        ],
        "certificates": [
            {
                "title": c.get("name"), "issuer": c.get("authority"),
                "issued_date": str((c.get("starts_at") or {}).get("year", "")) or None,
                "category": "Certification",
            }
            for c in (li.get("certifications") or [])
        ],
    }

    result = populate_db(db, data)
    return {
        "status": "success",
        "message": f"Synced from LinkedIn: {result.skills_created} skills, {result.experiences_created} experiences",
        "result": result.model_dump(),
    }
