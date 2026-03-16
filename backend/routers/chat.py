"""
Chat Router - AI chatbot endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import sys
sys.path.insert(0, "..")

from chatbot import chatbot
from database import get_students_collection, get_chat_history_collection
from datetime import datetime

router = APIRouter()


# ─────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    user_id: str
    message: str
    student_email: Optional[str] = None  # For profile personalization

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []
    has_context: bool = False
    timestamp: str

class ClearSessionRequest(BaseModel):
    user_id: str


# ─────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────
@router.post("/", response_model=ChatResponse)
async def send_message(req: ChatRequest):
    """Send a message to the AI career advisor chatbot."""
    try:
        # Optionally load student profile for personalization
        profile = None
        if req.student_email:
            col = get_students_collection()
            profile = await col.find_one(
                {"email": req.student_email},
                {"_id": 0}
            )

        # Get AI response
        result = await chatbot.chat(
            user_id=req.user_id,
            message=req.message,
            student_profile=profile
        )

        # Persist message to chat history
        history_col = get_chat_history_collection()
        await history_col.insert_one({
            "user_id": req.user_id,
            "role": "user",
            "content": req.message,
            "timestamp": datetime.utcnow()
        })
        await history_col.insert_one({
            "user_id": req.user_id,
            "role": "assistant",
            "content": result["response"],
            "sources": result["sources"],
            "timestamp": datetime.utcnow()
        })

        return ChatResponse(
            response=result["response"],
            sources=result["sources"],
            has_context=result["has_context"],
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


@router.post("/clear-session")
async def clear_session(req: ClearSessionRequest):
    """Clear the conversation history for a user session."""
    chatbot.clear_session(req.user_id)
    return {"message": "Session cleared successfully", "user_id": req.user_id}


@router.get("/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 50):
    """Get recent chat history for a user."""
    col = get_chat_history_collection()
    cursor = col.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    return {"user_id": user_id, "messages": list(reversed(messages))}
