"""Skill Gap Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from skill_gap_analyzer import analyze_skill_gap, analyze_multiple_careers
import json, pathlib

router = APIRouter()
DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "data"

class SkillGapRequest(BaseModel):
    user_skills: List[str]
    career_name: str

class MultiCareerGapRequest(BaseModel):
    user_skills: List[str]

@router.post("/analyze")
async def analyze_gap(req: SkillGapRequest):
    try:
        with open(DATA_DIR / "careers.json") as f:
            all_careers = json.load(f)
        career = next(
            (c for c in all_careers if c["career_name"].lower() == req.career_name.lower()),
            None
        )
        if not career:
            raise HTTPException(status_code=404, detail=f"Career '{req.career_name}' not found")
        result = analyze_skill_gap(
            user_skills=req.user_skills,
            career_name=career["career_name"],
            required_skills=career["required_skills"],
            nice_to_have_skills=career.get("nice_to_have_skills", [])
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-all")
async def compare_all_careers(req: MultiCareerGapRequest):
    try:
        with open(DATA_DIR / "careers.json") as f:
            all_careers = json.load(f)
        results = analyze_multiple_careers(req.user_skills, all_careers)
        return {"comparisons": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
