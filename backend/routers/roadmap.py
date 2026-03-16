"""Roadmap Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from roadmap_generator import generate_roadmap

router = APIRouter()

class RoadmapRequest(BaseModel):
    career_name: str
    user_skills: List[str] = []
    user_goal: Optional[str] = None
    include_courses: bool = True

@router.post("/")
async def get_learning_roadmap(req: RoadmapRequest):
    try:
        roadmap = generate_roadmap(
            career_name=req.career_name,
            user_skills=req.user_skills,
            user_goal=req.user_goal,
            include_courses=req.include_courses
        )
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/careers")
async def list_roadmap_careers():
    from roadmap_generator import CAREER_PHASES
    return {"careers": list(CAREER_PHASES.keys())}
