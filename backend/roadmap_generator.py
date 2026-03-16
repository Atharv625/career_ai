"""
Learning Roadmap Generator
Generates personalized, step-by-step learning roadmaps for career transitions
Combines static roadmap data with dynamic gap analysis
"""

from typing import List, Dict, Any, Optional
import json
import pathlib
from skill_gap_analyzer import analyze_skill_gap, SKILL_LEARNING_TIME

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"


# ─────────────────────────────────────────────────────────
# Phase Definitions for Each Career
# ─────────────────────────────────────────────────────────
CAREER_PHASES = {
    "AI/ML Engineer": [
        {"phase": "Foundation", "skills": ["Python", "Linear Algebra", "Statistics"], "weeks": 8},
        {"phase": "Core ML",    "skills": ["Machine Learning", "Supervised Learning", "Data Preprocessing"], "weeks": 10},
        {"phase": "Deep Learning", "skills": ["Deep Learning", "TensorFlow/PyTorch", "Neural Networks"], "weeks": 10},
        {"phase": "Applied AI", "skills": ["MLOps", "Model Deployment", "Cloud Platforms"], "weeks": 6},
        {"phase": "Portfolio",  "skills": ["Build 3-5 end-to-end ML projects", "Kaggle competitions", "Open source contributions"], "weeks": 8},
    ],
    "Full Stack Developer": [
        {"phase": "Web Fundamentals", "skills": ["HTML/CSS", "JavaScript Basics", "Git"], "weeks": 6},
        {"phase": "Frontend",         "skills": ["React", "State Management", "TypeScript"], "weeks": 8},
        {"phase": "Backend",          "skills": ["Node.js", "REST APIs", "Databases (SQL/NoSQL)"], "weeks": 8},
        {"phase": "DevOps Basics",    "skills": ["Docker", "CI/CD", "Cloud Deployment"], "weeks": 4},
        {"phase": "Portfolio",        "skills": ["Build 3 full-stack projects", "Deploy on cloud", "GitHub portfolio"], "weeks": 8},
    ],
    "Cloud/DevOps Engineer": [
        {"phase": "Linux & Networking", "skills": ["Linux", "Shell Scripting", "Networking TCP/IP"], "weeks": 6},
        {"phase": "Containers",         "skills": ["Docker", "Docker Compose", "Container Security"], "weeks": 4},
        {"phase": "Orchestration",      "skills": ["Kubernetes", "Helm", "Service Mesh"], "weeks": 6},
        {"phase": "Cloud Platform",     "skills": ["AWS or GCP", "IAM", "Managed Services"], "weeks": 8},
        {"phase": "IaC & CI/CD",        "skills": ["Terraform", "GitHub Actions", "Jenkins"], "weeks": 6},
        {"phase": "Certifications",     "skills": ["AWS Solutions Architect / GCP ACE", "CKA Kubernetes"], "weeks": 8},
    ],
    "Data Scientist": [
        {"phase": "Python & Math",  "skills": ["Python", "NumPy", "Pandas", "Matplotlib"], "weeks": 6},
        {"phase": "Statistics",     "skills": ["Statistics", "Probability", "Hypothesis Testing"], "weeks": 6},
        {"phase": "SQL & Data Eng", "skills": ["SQL", "Data Wrangling", "ETL Basics"], "weeks": 4},
        {"phase": "Machine Learning", "skills": ["Scikit-Learn", "Feature Engineering", "Model Evaluation"], "weeks": 8},
        {"phase": "Specialization", "skills": ["Deep Learning or Time Series or NLP"], "weeks": 8},
        {"phase": "Portfolio",      "skills": ["3+ Kaggle projects", "Business case studies", "Dashboard with Tableau/Plotly"], "weeks": 6},
    ],
    "Cybersecurity Engineer": [
        {"phase": "Fundamentals",   "skills": ["Networking", "Linux", "Operating System Security"], "weeks": 6},
        {"phase": "Security Core",  "skills": ["Cryptography", "PKI", "Authentication"], "weeks": 4},
        {"phase": "Offensive",      "skills": ["Penetration Testing", "Ethical Hacking", "Vulnerability Assessment"], "weeks": 8},
        {"phase": "Defensive",      "skills": ["SIEM Tools", "Incident Response", "Threat Intelligence"], "weeks": 6},
        {"phase": "Certifications", "skills": ["CompTIA Security+", "CEH or OSCP", "Cloud Security"], "weeks": 8},
    ],
    "Blockchain Developer": [
        {"phase": "Web Dev Basics",  "skills": ["JavaScript", "TypeScript", "React"], "weeks": 6},
        {"phase": "Blockchain Core", "skills": ["Cryptography Basics", "Ethereum", "Smart Contract Concepts"], "weeks": 4},
        {"phase": "Solidity Dev",    "skills": ["Solidity", "Hardhat/Foundry", "ERC Standards (ERC-20, ERC-721)"], "weeks": 8},
        {"phase": "Web3 Integration","skills": ["Ethers.js", "Web3.js", "IPFS"], "weeks": 6},
        {"phase": "Security & DeFi", "skills": ["Smart Contract Security", "DeFi Protocols", "Auditing"], "weeks": 8},
    ],
    "UX/UI Designer": [
        {"phase": "Design Fundamentals", "skills": ["Color Theory", "Typography", "Layout Composition"], "weeks": 4},
        {"phase": "UX Research",         "skills": ["User Research", "Personas", "User Journey Mapping"], "weeks": 4},
        {"phase": "UI Tooling",          "skills": ["Figma", "Prototyping", "Design Systems"], "weeks": 6},
        {"phase": "UX Process",          "skills": ["Wireframing", "Usability Testing", "Information Architecture"], "weeks": 4},
        {"phase": "Portfolio",           "skills": ["3+ case studies", "Design portfolio website", "Dribbble/Behance presence"], "weeks": 8},
    ],
    "Product Manager": [
        {"phase": "Business Fundamentals", "skills": ["Business Strategy", "Market Research", "Competitive Analysis"], "weeks": 4},
        {"phase": "Product Thinking",      "skills": ["Product Strategy", "User Stories", "Jobs-to-be-Done"], "weeks": 4},
        {"phase": "Execution",             "skills": ["Agile/Scrum", "Roadmapping", "Prioritization Frameworks"], "weeks": 4},
        {"phase": "Data-Driven PM",        "skills": ["SQL Basics", "Product Metrics", "A/B Testing"], "weeks": 4},
        {"phase": "Leadership",            "skills": ["Stakeholder Management", "Communication", "Technical Fluency"], "weeks": 4},
        {"phase": "Portfolio",             "skills": ["PM case studies", "Product teardowns", "Side product or feature spec"], "weeks": 6},
    ],
}


def generate_roadmap(
    career_name: str,
    user_skills: List[str],
    user_goal: str = "",
    include_courses: bool = True
) -> Dict[str, Any]:
    """
    Generate a personalized learning roadmap for a target career.

    Personalizes the standard roadmap by:
    - Marking already-known skills as complete
    - Highlighting priority gaps
    - Adding course recommendations per phase
    - Computing realistic timeline estimates
    """
    with open(DATA_DIR / "careers.json") as f:
        all_careers = json.load(f)
    with open(DATA_DIR / "courses.json") as f:
        all_courses = json.load(f)

    # Find career data
    career_data = next(
        (c for c in all_careers if c["career_name"].lower() == career_name.lower()),
        None
    )
    if not career_data:
        # Return generic roadmap
        return _generate_generic_roadmap(career_name, user_skills)

    # Compute skill gap
    gap = analyze_skill_gap(
        user_skills=user_skills,
        career_name=career_data["career_name"],
        required_skills=career_data["required_skills"],
        nice_to_have_skills=career_data.get("nice_to_have_skills", [])
    )

    # Get phase definitions
    phases = CAREER_PHASES.get(career_name, [])
    user_lower = {s.lower() for s in user_skills}

    roadmap_steps = []
    total_weeks   = 0
    step_number   = 1

    for phase in phases:
        phase_skills  = phase["skills"]
        phase_weeks   = phase["weeks"]

        # Determine which skills in this phase are known vs missing
        known_in_phase   = [s for s in phase_skills if s.lower() in user_lower]
        missing_in_phase = [s for s in phase_skills if s.lower() not in user_lower]

        # Skip phase entirely if user already has all skills
        if len(known_in_phase) == len(phase_skills):
            roadmap_steps.append({
                "step": step_number,
                "phase": phase["phase"],
                "status": "completed",
                "skills": phase_skills,
                "known_skills": known_in_phase,
                "missing_skills": [],
                "estimated_weeks": 0,
                "description": f"✅ You already have these skills for {phase['phase']}!",
            })
        else:
            adjusted_weeks = max(
                int(phase_weeks * (len(missing_in_phase) / len(phase_skills))), 1
            )
            total_weeks += adjusted_weeks

            # Find relevant courses for this phase
            phase_courses = []
            if include_courses:
                for course in all_courses:
                    if career_name in course.get("career_category", []):
                        skills_covered = [
                            s for s in missing_in_phase
                            if any(s.lower() in taught.lower() for taught in course.get("skills_taught", []))
                        ]
                        if skills_covered:
                            phase_courses.append({
                                "name": course["course_name"],
                                "platform": course["platform"],
                                "rating": course["rating"],
                                "url": course.get("url", "#"),
                                "skills_covered": skills_covered,
                            })

            roadmap_steps.append({
                "step": step_number,
                "phase": phase["phase"],
                "status": "in_progress" if step_number == 1 else "upcoming",
                "skills": phase_skills,
                "known_skills": known_in_phase,
                "missing_skills": missing_in_phase,
                "estimated_weeks": adjusted_weeks,
                "description": f"Focus on: {', '.join(missing_in_phase[:3])}",
                "courses": phase_courses[:2],
            })

        step_number += 1

    return {
        "career_name": career_data["career_name"],
        "user_goal": user_goal or f"Become a {career_data['career_name']}",
        "description": career_data["description"],
        "readiness_level": gap["readiness_level"],
        "match_percentage": gap["match_percentage"],
        "total_phases": len(roadmap_steps),
        "estimated_total_weeks": total_weeks,
        "estimated_total_months": round(total_weeks / 4, 1),
        "salary_range": career_data.get("salary_range", {}),
        "growth_outlook": career_data.get("growth_outlook", "N/A"),
        "steps": roadmap_steps,
        "skill_summary": {
            "total_required": gap["skill_counts"]["total_required"],
            "already_have": gap["skill_counts"]["matched"],
            "need_to_learn": gap["skill_counts"]["missing"],
        }
    }


def _generate_generic_roadmap(career_name: str, user_skills: List[str]) -> Dict[str, Any]:
    """Fallback roadmap for careers not in the detailed phase map."""
    return {
        "career_name": career_name,
        "user_goal": f"Become a {career_name}",
        "description": f"Custom roadmap for {career_name}",
        "readiness_level": "Unknown",
        "match_percentage": "N/A",
        "total_phases": 4,
        "estimated_total_weeks": 24,
        "estimated_total_months": 6.0,
        "steps": [
            {"step": 1, "phase": "Fundamentals",    "status": "upcoming", "estimated_weeks": 6,  "description": "Build core technical foundation"},
            {"step": 2, "phase": "Core Skills",      "status": "upcoming", "estimated_weeks": 8,  "description": "Learn primary tools and technologies"},
            {"step": 3, "phase": "Applied Practice", "status": "upcoming", "estimated_weeks": 6,  "description": "Build projects and apply skills"},
            {"step": 4, "phase": "Portfolio & Jobs", "status": "upcoming", "estimated_weeks": 4,  "description": "Portfolio, networking, and job applications"},
        ]
    }
