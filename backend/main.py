"""
Career Advisor AI - FastAPI Backend
Main application entry point with all routes registered
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from routers import chat, careers, students, recommendations, roadmap, skill_gap
from database import connect_to_mongo, close_mongo_connection

# ─────────────────────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Career Advisor AI",
    description="One-Stop Career & Education Advice System powered by Gemini AI",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# ─────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─────────────────────────────────────────────────────────
# Startup / Shutdown Events
# ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# ─────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────
app.include_router(chat.router,            prefix="/api/chat",           tags=["AI Chatbot"])
app.include_router(careers.router,         prefix="/api/careers",        tags=["Careers"])
app.include_router(students.router,        prefix="/api/students",       tags=["Students"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(roadmap.router,         prefix="/api/roadmap",        tags=["Learning Roadmap"])
app.include_router(skill_gap.router,       prefix="/api/skill-gap",      tags=["Skill Gap Analysis"])

# ─────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Career Advisor AI",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
