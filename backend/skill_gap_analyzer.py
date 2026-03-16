"""
Skill Gap Analyzer - Computes missing skills between user profile and career requirements
Returns structured gap analysis with priority levels and learning estimates
"""

from typing import List, Dict, Any
import json
import pathlib

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"


# ─────────────────────────────────────────────────────────
# Skill normalization (handle capitalization / aliases)
# ─────────────────────────────────────────────────────────
SKILL_ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "py": "Python",
    "python": "Python",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "k8s": "Kubernetes",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "react": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "sql": "SQL",
    "nosql": "NoSQL",
    "mongodb": "MongoDB",
    "postgres": "PostgreSQL",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "docker": "Docker",
    "git": "Git",
    "linux": "Linux",
}

# Approximate learning time per skill (weeks)
SKILL_LEARNING_TIME = {
    "Python": 4,
    "JavaScript": 4,
    "TypeScript": 2,
    "React": 3,
    "Node.js": 3,
    "SQL": 3,
    "MongoDB": 2,
    "Machine Learning": 12,
    "Deep Learning": 10,
    "TensorFlow": 4,
    "PyTorch": 4,
    "Linear Algebra": 6,
    "Statistics": 6,
    "Docker": 2,
    "Kubernetes": 4,
    "AWS": 8,
    "GCP": 8,
    "Azure": 8,
    "Linux": 3,
    "Git": 1,
    "Solidity": 6,
    "Figma": 3,
    "default": 4,
}

# Skill importance tiers
CRITICAL_SKILLS = {
    "AI/ML Engineer": ["Python", "Machine Learning", "Deep Learning"],
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL"],
    "Cloud/DevOps Engineer": ["Docker", "Kubernetes", "Linux", "AWS"],
    "Data Scientist": ["Python", "Statistics", "Machine Learning", "SQL"],
    "Cybersecurity Engineer": ["Linux", "Networking", "Cryptography"],
    "Blockchain Developer": ["Solidity", "JavaScript", "Web3.js"],
    "UX/UI Designer": ["Figma", "User Research", "Wireframing"],
    "Product Manager": ["Product Strategy", "Agile/Scrum", "Data Analysis"],
}


def normalize_skill(skill: str) -> str:
    """Normalize skill name using aliases."""
    return SKILL_ALIASES.get(skill.lower().strip(), skill.strip())


def normalize_skills(skills: List[str]) -> List[str]:
    return [normalize_skill(s) for s in skills]


def compute_skill_match_score(user_skills: List[str], required_skills: List[str]) -> float:
    """Return 0.0-1.0 score of how well user skills match required skills."""
    if not required_skills:
        return 1.0
    user_lower  = {s.lower() for s in user_skills}
    req_lower   = {s.lower() for s in required_skills}
    matched     = len(user_lower & req_lower)
    return round(matched / len(req_lower), 2)


def analyze_skill_gap(
    user_skills: List[str],
    career_name: str,
    required_skills: List[str],
    nice_to_have_skills: List[str] = None
) -> Dict[str, Any]:
    """
    Full skill gap analysis between user skills and a target career.

    Returns:
        {
          career_name, match_score, user_skills, required_skills,
          matched_skills, missing_skills, nice_to_have_missing,
          priority_skills, estimated_learning_weeks, readiness_level
        }
    """
    nice_to_have_skills = nice_to_have_skills or []

    # Normalize all skill lists
    user_norm       = normalize_skills(user_skills)
    required_norm   = normalize_skills(required_skills)
    nice_norm       = normalize_skills(nice_to_have_skills)

    user_set    = {s.lower() for s in user_norm}
    req_set     = {s.lower() for s in required_norm}

    # Compute matches and gaps
    matched     = [s for s in required_norm if s.lower() in user_set]
    missing     = [s for s in required_norm if s.lower() not in user_set]
    nice_gap    = [s for s in nice_norm    if s.lower() not in user_set]

    match_score = compute_skill_match_score(user_norm, required_norm)

    # Identify priority (critical) missing skills
    critical    = CRITICAL_SKILLS.get(career_name, [])
    priority    = [s for s in missing if s in critical]
    secondary   = [s for s in missing if s not in critical]

    # Estimate total learning time
    total_weeks = sum(
        SKILL_LEARNING_TIME.get(s, SKILL_LEARNING_TIME["default"])
        for s in missing
    )

    # Readiness level based on match score
    if match_score >= 0.8:
        readiness = "Ready"
    elif match_score >= 0.6:
        readiness = "Almost Ready"
    elif match_score >= 0.4:
        readiness = "Developing"
    elif match_score >= 0.2:
        readiness = "Beginner"
    else:
        readiness = "Just Starting"

    return {
        "career_name": career_name,
        "match_score": match_score,
        "match_percentage": f"{int(match_score * 100)}%",
        "readiness_level": readiness,
        "user_skills": user_norm,
        "required_skills": required_norm,
        "matched_skills": matched,
        "missing_skills": missing,
        "priority_missing": priority,
        "secondary_missing": secondary,
        "nice_to_have_missing": nice_gap,
        "estimated_learning_weeks": total_weeks,
        "estimated_learning_months": round(total_weeks / 4, 1),
        "skill_counts": {
            "total_required": len(required_norm),
            "matched": len(matched),
            "missing": len(missing),
        }
    }


def analyze_multiple_careers(
    user_skills: List[str],
    career_data: List[Dict]
) -> List[Dict[str, Any]]:
    """
    Analyze skill gaps for multiple careers and rank by match score.
    Useful for the recommendation engine.
    """
    results = []
    for career in career_data:
        gap = analyze_skill_gap(
            user_skills=user_skills,
            career_name=career["career_name"],
            required_skills=career["required_skills"],
            nice_to_have_skills=career.get("nice_to_have_skills", [])
        )
        gap["salary_range"] = career.get("salary_range", {})
        gap["growth_outlook"] = career.get("growth_outlook", "Unknown")
        gap["difficulty"] = career.get("difficulty", "Medium")
        gap["category"] = career.get("category", "")
        results.append(gap)

    # Sort by match score descending
    return sorted(results, key=lambda x: x["match_score"], reverse=True)
