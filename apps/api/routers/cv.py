from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import json
import asyncio
import httpx

from database import get_db
from auth import get_current_admin
from models import (
    CVDocument, CVChunk,
    Profile, Skill, Experience, Education, Project, Certificate, Achievement, SocialLink,
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


# ── Gemini extraction ──────────────────────────────────────────────────────────

async def gemini_extract(cv_text: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )

    prompt = f"""Parse this CV/resume and return structured JSON.

CV:
{cv_text[:12000]}

Return exactly this JSON structure:
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
  "projects": [
    {{
      "title": "...", "description": "One-sentence summary",
      "technologies": ["Python", "React"],
      "category": "AI / ML",
      "github_url": null, "demo_url": null, "appstore_url": null,
      "is_featured": false
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
- Project categories: "AI / ML", "Full Stack", "iOS", "DevOps", "Open Source", "Research"
- Set is_featured true for the 2-3 most impressive or complex projects
- Extract every project mentioned anywhere in the CV (side projects, work projects, research, open source)
"""

    response = await model.generate_content_async(prompt)
    return json.loads(response.text)


# ── Chunking + Gemini embeddings ───────────────────────────────────────────────

def chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start: start + size])
        start += size - overlap
    return chunks


async def embed_texts(texts: list[str]) -> list[list[float]] | None:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    def _batch(batch):
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=[t[:8000] for t in batch],
            task_type="retrieval_document",
        )
        return result["embedding"]

    try:
        return await asyncio.to_thread(_batch, texts)
    except Exception:
        return None


# ── Native CV parser (fallback when Gemini is unavailable) ────────────────────

def parse_cv_native(text: str) -> dict:
    """Regex/heuristic parser — used when Gemini quota is exhausted or unavailable."""
    import re

    lines    = text.splitlines()
    stripped = [l.strip() for l in lines]
    nonempty = [l for l in stripped if l]

    # ── Profile ────────────────────────────────────────────────────────────────
    email_m = re.search(r'[\w.+\-]+@[\w\-]+\.[\w.\-]+', text)
    phone_m = re.search(r'[\+\(]?[\d]{1,4}[\)\s\-.]?[\d]{2,5}[\s\-.]?[\d]{4,10}', text)
    loc_m   = re.search(r'\b([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+){0,2}),\s*([A-Z]{2,}|[A-Z][a-z]+)\b', text)
    url_m   = re.search(r'github\.com/[\w\-]+', text, re.IGNORECASE)

    # Name is usually the first non-email, non-phone, non-URL meaningful line
    name    = next(
        (l for l in nonempty if not re.search(r'[@\d/\\]', l) and len(l) < 80),
        "Portfolio Owner"
    )
    tagline = next(
        (l for l in nonempty[1:4] if l != name and len(l) < 120
         and not re.search(r'[@\d]', l)),
        None
    )

    profile = {
        "name":         name,
        "tagline":      tagline,
        "bio":          None,
        "email":        email_m.group(0) if email_m else None,
        "phone":        phone_m.group(0) if phone_m else None,
        "location":     loc_m.group(0)   if loc_m   else None,
        "open_to_work": True,
    }

    # ── Section splitting ──────────────────────────────────────────────────────
    SECTION_ALIASES = {
        "experience":    ["experience", "work experience", "professional experience",
                          "employment", "work history", "career"],
        "education":     ["education", "academic", "qualifications", "academics"],
        "skills":        ["skills", "technical skills", "core competencies",
                          "competencies", "technologies", "tech stack",
                          "tools & technologies", "languages & tools"],
        "projects":      ["projects", "personal projects", "side projects",
                          "portfolio", "key projects", "notable projects",
                          "selected projects"],
        "certificates":  ["certifications", "certification", "certificates",
                          "licenses & certifications", "professional development",
                          "credentials"],
        "achievements":  ["achievements", "awards", "honors", "accomplishments",
                          "recognition", "publications"],
        "summary":       ["summary", "profile", "about", "objective",
                          "professional summary", "career objective"],
    }

    def classify_header(line: str) -> str | None:
        norm = re.sub(r'[^a-z\s&]', '', line.lower()).strip()
        for key, aliases in SECTION_ALIASES.items():
            if any(norm == a or norm.startswith(a) for a in aliases):
                return key
        return None

    sections: dict[str, list[str]] = {}
    current = "_header"
    for line in stripped:
        cls = classify_header(line) if len(line) < 55 else None
        if cls:
            current = cls
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)

    def sec(*keys) -> list[str]:
        for k in keys:
            if k in sections:
                return [l for l in sections[k] if l]
        return []

    # ── Skills ─────────────────────────────────────────────────────────────────
    LANG_KW  = {'python','java','swift','kotlin','go','rust','c++','c#','javascript',
                'typescript','ruby','php','scala','dart','r'}
    AI_KW    = {'tensorflow','pytorch','keras','nlp','llm','bert','gpt','huggingface',
                'scikit','pandas','numpy','opencv','langchain','rag','ml','ai'}
    IOS_KW   = {'swiftui','xcode','uikit','objective-c','ios','coredata','combine'}
    WEB_KW   = {'react','vue','angular','svelte','next','node','express','django',
                'flask','fastapi','spring','rails','graphql','rest'}
    CLOUD_KW = {'aws','azure','gcp','firebase','vercel','netlify','heroku','cloudflare'}
    DEVOPS_KW= {'docker','kubernetes','ci/cd','jenkins','github actions','terraform',
                'ansible','gitlab','ci'}

    def skill_cat(name: str) -> str:
        n = name.lower()
        if any(k in n for k in AI_KW):    return "AI / ML"
        if any(k in n for k in IOS_KW):   return "iOS"
        if any(k in n for k in WEB_KW):   return "Full Stack"
        if any(k in n for k in CLOUD_KW): return "Cloud"
        if any(k in n for k in DEVOPS_KW):return "DevOps"
        if any(k in n for k in LANG_KW):  return "Languages"
        return "Tools"

    skills = []
    seen_skills: set[str] = set()
    for line in sec("skills"):
        for item in re.split(r'[,|•·\t]+', line):
            item = item.strip().strip('•-–—*() ')
            key  = item.lower()
            if 2 <= len(item) <= 50 and not re.match(r'^[\d.%]+$', item) and key not in seen_skills:
                seen_skills.add(key)
                skills.append({"name": item, "category": skill_cat(item), "proficiency": 80})

    # ── Experiences ─────────────────────────────────────────────────────────────
    DATE_RE   = re.compile(
        r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
        r'|January|February|March|April|June|July|August|September|October|November|December)'
        r'\.?\s+\d{4}|\d{4}',
        re.IGNORECASE
    )
    CURRENT_RE = re.compile(r'\b(present|current|now|ongoing)\b', re.IGNORECASE)

    def split_blocks(src_lines: list[str]) -> list[list[str]]:
        """Split a flat list into blocks, each starting with a 'title-like' line."""
        blocks, block = [], []
        for line in src_lines:
            # A new block starts when line is short AND has no leading bullet
            is_title = (
                len(line) < 90
                and not line.startswith(('•', '-', '–', '—', '*', '\t'))
                and not re.match(r'^\d+\.', line)
            )
            if is_title and block:
                blocks.append(block)
                block = [line]
            else:
                block.append(line)
        if block:
            blocks.append(block)
        return blocks

    experiences = []
    for block in split_blocks(sec("experience")):
        all_text = " ".join(block)
        dates     = DATE_RE.findall(all_text)
        is_cur    = bool(CURRENT_RE.search(all_text))
        experiences.append({
            "company":     block[0],
            "role":        block[1] if len(block) > 1 else "Engineer",
            "description": " ".join(b.strip("•-–—* ") for b in block[2:] if b).strip() or None,
            "start_date":  dates[0] if dates else None,
            "end_date":    None if is_cur else (dates[1] if len(dates) > 1 else None),
            "is_current":  is_cur,
            "location":    None,
            "technologies":[],
        })

    # ── Education ──────────────────────────────────────────────────────────────
    EDU_RE = re.compile(
        r'\b(B\.?[SE]\.?|M\.?[SE]\.?|Ph\.?D|Bachelor|Master|Doctor|MBA|BCA|MCA|'
        r'B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|B\.?Sc|M\.?Sc|Associate)\b',
        re.IGNORECASE
    )
    education = []
    for block in split_blocks(sec("education")):
        all_text = " ".join(block)
        years    = re.findall(r'\d{4}', all_text)
        deg_line = next((l for l in block if EDU_RE.search(l)), block[1] if len(block) > 1 else block[0])
        education.append({
            "institution": block[0],
            "degree":      deg_line,
            "field":       None,
            "start_date":  years[0] if years else None,
            "end_date":    years[1] if len(years) > 1 else None,
            "gpa":         None,
        })

    # ── Projects ───────────────────────────────────────────────────────────────
    TECH_RE = re.compile(
        r'\b(Python|JavaScript|TypeScript|Swift|Kotlin|Go|Rust|React|Vue|Angular|'
        r'Svelte|Node\.?js|FastAPI|Django|Flask|TensorFlow|PyTorch|Docker|Kubernetes|'
        r'AWS|GCP|Azure|iOS|Android|SwiftUI|MongoDB|PostgreSQL|Redis|GraphQL|'
        r'LangChain|LLM|RAG|Transformers|HuggingFace|OpenAI)\b',
        re.IGNORECASE
    )

    projects = []
    for i, block in enumerate(split_blocks(sec("projects"))):
        all_text = " ".join(block)
        techs    = list(dict.fromkeys(TECH_RE.findall(all_text)))
        gh_m     = re.search(r'https?://github\.com/\S+', all_text)
        demo_m   = re.search(r'https?://(?!github)\S+', all_text)
        desc_    = " ".join(b.strip("•-–—* ") for b in block[1:] if b).strip() or None

        n = all_text.lower()
        if any(k in n for k in ['tensorflow','pytorch','ml','nlp','llm','ai','model']):
            cat = "AI / ML"
        elif any(k in n for k in ['swift','swiftui','ios','xcode']):
            cat = "iOS"
        else:
            cat = "Full Stack"

        if block[0] and len(block[0]) > 2:
            projects.append({
                "title":       block[0],
                "description": desc_,
                "technologies": techs[:8],
                "category":    cat,
                "github_url":  gh_m.group(0)   if gh_m   else None,
                "demo_url":    demo_m.group(0)  if demo_m else None,
                "appstore_url": None,
                "is_featured": i < 3,
            })

    # ── Certificates ───────────────────────────────────────────────────────────
    certificates = []
    for line in sec("certificates"):
        clean = line.strip("•-–—* ")
        if len(clean) < 5:
            continue
        parts  = re.split(r'\s*[—\-|,]\s*', clean, maxsplit=1)
        title  = parts[0].strip()
        issuer = parts[1].strip() if len(parts) > 1 else "Unknown Issuer"
        yr_m   = re.search(r'\d{4}', clean)
        tl     = title.lower()
        cat    = "AI / ML" if any(k in tl for k in ['ml','ai','deep','tensorflow','data science','aws machine']) else "Certification"
        if title:
            certificates.append({
                "title":       title,
                "issuer":      issuer,
                "issued_date": yr_m.group(0) if yr_m else None,
                "category":    cat,
            })

    # ── Achievements ───────────────────────────────────────────────────────────
    achievements = []
    for line in sec("achievements"):
        clean = line.strip("•-–—* ")
        if len(clean) > 5:
            yr_m = re.search(r'\d{4}', clean)
            achievements.append({
                "title":       clean,
                "description": None,
                "date":        yr_m.group(0) if yr_m else None,
                "icon":        "🏆",
            })

    return {
        "profile":      profile,
        "skills":       skills[:40],
        "experiences":  experiences,
        "education":    education,
        "projects":     projects,
        "certificates": certificates,
        "achievements": achievements,
    }


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

    for proj in data.get("projects") or []:
        if proj.get("title"):
            db.add(Project(
                title=proj["title"],
                description=proj.get("description"),
                technologies=proj.get("technologies") or [],
                category=proj.get("category"),
                github_url=proj.get("github_url"),
                demo_url=proj.get("demo_url"),
                appstore_url=proj.get("appstore_url"),
                is_featured=bool(proj.get("is_featured")),
                display_order=result.projects_created,
            ))
            result.projects_created += 1
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
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    content = await file.read()
    try:
        raw_text = parse_pdf(content)
    except Exception as e:
        raise HTTPException(400, f"Could not parse PDF: {e}")

    db.query(CVDocument).update({"is_active": False})
    cv_doc = CVDocument(filename=file.filename, raw_text=raw_text, is_active=True)
    db.add(cv_doc)
    db.commit()
    db.refresh(cv_doc)

    used_fallback = False
    if settings.GEMINI_API_KEY:
        try:
            extracted = await gemini_extract(raw_text)
        except Exception:
            extracted    = parse_cv_native(raw_text)
            used_fallback = True
    else:
        extracted    = parse_cv_native(raw_text)
        used_fallback = True

    result = populate_db(db, extracted)

    texts = chunk_text(raw_text)
    embeddings = await embed_texts(texts) if settings.GEMINI_API_KEY else None
    for i, text in enumerate(texts):
        db.add(CVChunk(
            document_id=cv_doc.id,
            chunk_text=text,
            chunk_index=i,
            embedding=embeddings[i] if embeddings else None,
        ))
    db.commit()

    result.chunks_embedded = len(texts) if embeddings else 0
    parser_note = " [native parser — Gemini unavailable]" if used_fallback else ""
    result.message = (
        f"Extracted {result.skills_created} skills, "
        f"{result.experiences_created} experiences, "
        f"{result.projects_created} projects, "
        f"{result.education_created} education records, "
        f"{result.certificates_created} certificates"
        f"{parser_note}"
    )
    return result


@router.post("/linkedin")
async def sync_linkedin(
    body: LinkedInSyncRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    url = body.linkedin_url.strip()

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
        return f"{m}/{y}" if (y and m) else (str(y) if y else None)

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
                "start_date": _date(e, "starts_at"), "end_date": _date(e, "ends_at"),
                "is_current": e.get("ends_at") is None, "technologies": [],
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
