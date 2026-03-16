"""
Recommendation Engine
- Career recommendations based on skills, interests, and education
- Course recommendations based on skill gaps and career goals
Uses a scoring algorithm combining: skill match, interest alignment, difficulty preference
"""

from typing import List, Dict, Any, Optional
import json
import pathlib
from skill_gap_analyzer import compute_skill_match_score, normalize_skills

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"


# ─────────────────────────────────────────────────────────
# Interest-to-Career Mapping
# ─────────────────────────────────────────────────────────
INTEREST_CAREER_MAP = {
    "programming":      ["AI/ML Engineer", "Full Stack Developer", "Blockchain Developer"],
    "data":             ["Data Scientist", "AI/ML Engineer"],
    "design":           ["UX/UI Designer"],
    "security":         ["Cybersecurity Engineer"],
    "cloud":            ["Cloud/DevOps Engineer"],
    "management":       ["Product Manager"],
    "web":              ["Full Stack Developer", "UX/UI Designer"],
    "mobile":           ["Full Stack Developer"],
    "finance":          ["Data Scientist", "Blockchain Developer", "Product Manager"],
    "mathematics":      ["Data Scientist", "AI/ML Engineer"],
    "blockchain":       ["Blockchain Developer"],
    "infrastructure":   ["Cloud/DevOps Engineer"],
    "creativity":       ["UX/UI Designer", "Product Manager"],
    "research":         ["AI/ML Engineer", "Data Scientist"],
    "entrepreneurship": ["Product Manager", "Full Stack Developer"],
}

# Education-level scoring boost
EDUCATION_BOOST = {
    "high school": 0.0,
    "diploma": 0.05,
    "bachelor": 0.10,
    "master": 0.15,
    "phd": 0.20,
    "bootcamp": 0.05,
    "self-taught": 0.0,
}


# ─────────────────────────────────────────────────────────
# Career Recommendation Engine
# ─────────────────────────────────────────────────────────
def recommend_careers(
    skills: List[str],
    interests: List[str],
    education: str = "bachelor",
    preferred_difficulty: Optional[str] = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Recommend careers based on skill match + interest alignment + education.

    Scoring formula:
      score = (skill_match * 0.5) + (interest_score * 0.35) + (education_boost * 0.15)
    """
    with open(DATA_DIR / "careers.json") as f:
        all_careers = json.load(f)

    norm_skills    = normalize_skills(skills)
    norm_interests = [i.lower().strip() for i in interests]
    edu_boost      = EDUCATION_BOOST.get(education.lower(), 0.0)
    results        = []

    for career in all_careers:
        # 1. Skill match score
        skill_score = compute_skill_match_score(norm_skills, career["required_skills"])

        # 2. Interest alignment score
        career_name_lower = career["career_name"].lower()
        career_tags       = [t.lower() for t in career.get("tags", [])]
        interest_hits     = 0
        total_interest_signals = 0

        for interest in norm_interests:
            total_interest_signals += 1
            matched_careers = INTEREST_CAREER_MAP.get(interest, [])
            if career["career_name"] in matched_careers:
                interest_hits += 1
            elif any(interest in tag for tag in career_tags):
                interest_hits += 0.5
            elif interest in career_name_lower:
                interest_hits += 0.5

        interest_score = (interest_hits / total_interest_signals) if total_interest_signals > 0 else 0.0
        interest_score = min(interest_score, 1.0)  # Cap at 1.0

        # 3. Composite score
        final_score = (skill_score * 0.50) + (interest_score * 0.35) + (edu_boost * 0.15)

        # 4. Optional difficulty filter
        if preferred_difficulty and career.get("difficulty", "").lower() != preferred_difficulty.lower():
            final_score *= 0.8  # Slight penalty, don't exclude entirely

        results.append({
            "career_name": career["career_name"],
            "category": career.get("category", ""),
            "description": career.get("description", ""),
            "score": round(final_score, 3),
            "skill_match": f"{int(skill_score * 100)}%",
            "interest_alignment": f"{int(interest_score * 100)}%",
            "salary_range": career.get("salary_range", {}),
            "growth_outlook": career.get("growth_outlook", "N/A"),
            "difficulty": career.get("difficulty", "Medium"),
            "required_skills": career.get("required_skills", []),
            "matched_skills": [s for s in norm_skills if s in career["required_skills"]],
            "missing_skills": [s for s in career["required_skills"] if s not in norm_skills],
            "job_roles": career.get("job_roles", []),
            "tags": career.get("tags", []),
        })

    # Sort by composite score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


# ─────────────────────────────────────────────────────────
# Course Recommendation Engine
# ─────────────────────────────────────────────────────────
def recommend_courses(
    career_name: Optional[str] = None,
    missing_skills: Optional[List[str]] = None,
    difficulty: Optional[str] = None,
    platform: Optional[str] = None,
    top_k: int = 6
) -> List[Dict[str, Any]]:
    """
    Recommend courses based on:
    - Target career
    - Missing skills that need to be filled
    - Optional platform and difficulty filters
    """
    with open(DATA_DIR / "courses.json") as f:
        all_courses = json.load(f)

    norm_missing = normalize_skills(missing_skills or [])
    results      = []

    for course in all_courses:
        score = 0.0

        # Career category match
        if career_name:
            if career_name in course.get("career_category", []):
                score += 0.5

        # Skill coverage (how many missing skills does this course teach?)
        course_skills = [s.lower() for s in course.get("skills_taught", [])]
        if norm_missing:
            skill_coverage = sum(
                1 for s in norm_missing if s.lower() in course_skills
            )
            score += (skill_coverage / len(norm_missing)) * 0.4

        # Rating bonus
        score += (course.get("rating", 4.0) / 5.0) * 0.1

        # Platform filter
        if platform and course.get("platform", "").lower() != platform.lower():
            continue  # Hard filter

        # Difficulty filter (soft)
        if difficulty:
            course_diff = course.get("difficulty", "Intermediate").lower()
            req_diff    = difficulty.lower()
            if course_diff != req_diff:
                score *= 0.8

        if score > 0:
            results.append({
                **course,
                "relevance_score": round(score, 3),
                "skills_covered": [
                    s for s in norm_missing if s.lower() in course_skills
                ]
            })

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return results[:top_k]
