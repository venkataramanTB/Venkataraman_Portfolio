from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json

from database import get_db
from models import CVDocument, CVChunk
from schemas import ChatRequest
from config import settings

router = APIRouter(tags=["chat"])

_SYSTEM = """You are an AI assistant embedded in Venkataraman TB's portfolio website.
Help visitors learn about his skills, experience, projects, education, and achievements.

His CV / resume:
---
{context}
---

Rules:
- Be friendly, concise, and professional
- Answers under 200 words unless the visitor explicitly asks for detail
- Use bullet points when listing multiple things
- Never fabricate facts beyond what is in the CV
- If asked something not covered, say you don't have that info and suggest contacting him directly"""


async def _get_context(db: Session, question: str) -> str:
    cv = db.query(CVDocument).filter_by(is_active=True).first()
    if not cv:
        return "No CV has been uploaded yet."

    # Semantic search if embeddings + OpenAI key available
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            q_resp = await client.embeddings.create(
                model="text-embedding-3-small", input=question[:500]
            )
            q_emb = q_resp.data[0].embedding
            chunks = (
                db.query(CVChunk)
                .filter(CVChunk.document_id == cv.id, CVChunk.embedding.isnot(None))
                .order_by(CVChunk.embedding.cosine_distance(q_emb))
                .limit(5)
                .all()
            )
            if chunks:
                return "\n\n---\n\n".join(c.chunk_text for c in chunks)
        except Exception:
            pass

    return cv.raw_text[:8000]


@router.post("/chat")
async def chat(body: ChatRequest, db: Session = Depends(get_db)):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(503, "AI chat is not configured on this server")

    import anthropic

    last_user_msg = next(
        (m.content for m in reversed(body.messages) if m.role == "user"), ""
    )
    context = await _get_context(db, last_user_msg)
    system = _SYSTEM.format(context=context)
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def generate():
        try:
            with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=system,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
