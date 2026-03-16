"""Recommendations Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from recommendation_engine import recommend_careers, recommend_courses

router = APIRouter()

class CareerRecommendationRequest(BaseModel):
    skills: List[str]
    interests: List[str]
    education: str = "bachelor"
    preferred_difficulty: Optional[str] = None
    top_k: int = 5

class CourseRecommendationRequest(BaseModel):
    career_name: Optional[str] = None
    missing_skills: Optional[List[str]] = None
    difficulty: Optional[str] = None
    platform: Optional[str] = None
    top_k: int = 6

@router.post("/careers")
async def get_career_recommendations(req: CareerRecommendationRequest):
    try:
        recommendations = recommend_careers(
            skills=req.skills,
            interests=req.interests,
            education=req.education,
            preferred_difficulty=req.preferred_difficulty,
            top_k=req.top_k
        )
        return {"recommendations": recommendations, "count": len(recommendations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/courses")
async def get_course_recommendations(req: CourseRecommendationRequest):
    try:
        courses = recommend_courses(
            career_name=req.career_name,
            missing_skills=req.missing_skills,
            difficulty=req.difficulty,
            platform=req.platform,
            top_k=req.top_k
        )
        return {"courses": courses, "count": len(courses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
