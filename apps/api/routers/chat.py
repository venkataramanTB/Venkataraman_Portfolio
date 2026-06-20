from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import asyncio

from database import get_db
from models import CVDocument, CVChunk
from schemas import ChatRequest
from config import settings

router = APIRouter(tags=["chat"])

_SYSTEM = """You are an AI assistant embedded in Venkataraman TB's portfolio website. \
Help visitors learn about his skills, experience, projects, education, and achievements.

Relevant CV context:
---
{context}
---

Rules:
- Be friendly, concise, and professional
- Keep answers under 200 words unless the visitor explicitly asks for detail
- Use bullet points when listing multiple items
- Never fabricate facts beyond what is in the CV context
- If asked something not in the CV, say you don't have that info and suggest contacting him directly"""


async def _embed_query(question: str) -> list[float]:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    def _run():
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=question[:2000],
            task_type="retrieval_query",
        )
        return result["embedding"]

    return await asyncio.to_thread(_run)


async def _get_context(db: Session, question: str) -> str:
    cv = db.query(CVDocument).filter_by(is_active=True).first()
    if not cv:
        return "No CV has been uploaded yet."

    try:
        q_emb = await _embed_query(question)
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
    if not settings.GEMINI_API_KEY:
        raise HTTPException(503, "AI chat is not configured on this server")

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    last_user_msg = next(
        (m.content for m in reversed(body.messages) if m.role == "user"), ""
    )
    context = await _get_context(db, last_user_msg)
    system = _SYSTEM.format(context=context)

    history = [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [m.content],
        }
        for m in body.messages[:-1]
    ]
    last_content = body.messages[-1].content if body.messages else ""

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system,
    )
    chat_session = model.start_chat(history=history)

    async def generate():
        try:
            response = await chat_session.send_message_async(last_content, stream=True)
            async for chunk in response:
                text = getattr(chunk, "text", None)
                if text:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
