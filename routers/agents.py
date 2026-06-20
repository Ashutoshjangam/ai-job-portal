"""
Agents Router — /api/agents/*
Endpoints for all 4 remaining agents.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.job_matching       import find_matching_jobs
from agents.skill_gap          import analyze_skill_gap
from agents.interview_questions import generate_interview_questions
from agents.learning_roadmap   import generate_learning_roadmap

router = APIRouter(prefix="/api/agents", tags=["Agents"])


# ── Request / Response models ─────────────────────────────────────────────────

class JobMatchRequest(BaseModel):
    skills: list[str]
    recommended_roles: list[str]
    experience_years: int = 0
    current_role: str = ""
    country: str = "in"


class SkillGapRequest(BaseModel):
    candidate_skills: list[str]
    job_description: str


class InterviewRequest(BaseModel):
    skills: list[str]
    experience_years: int = 0
    projects: list[dict] = []
    target_role: str


class RoadmapRequest(BaseModel):
    current_skills: list[str]
    missing_skills: list[dict]
    experience_years: int = 0
    target_role: str
    hours_per_week: int = 10


# ── Job Matching ──────────────────────────────────────────────────────────────

@router.post("/match-jobs")
async def match_jobs(req: JobMatchRequest):
    """
    Fetch live jobs from Adzuna and score each against the candidate's profile.
    """
    if not req.skills:
        raise HTTPException(status_code=400, detail="Skills list cannot be empty.")
    if not req.recommended_roles:
        raise HTTPException(status_code=400, detail="Recommended roles cannot be empty.")

    try:
        jobs = find_matching_jobs(
            candidate_skills=req.skills,
            recommended_roles=req.recommended_roles,
            experience_years=req.experience_years,
            current_role=req.current_role,
            country=req.country,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": jobs, "total": len(jobs)}


# ── Skill Gap ─────────────────────────────────────────────────────────────────

@router.post("/skill-gap")
async def skill_gap(req: SkillGapRequest):
    """
    Compare candidate skills against a job description and identify gaps.
    """
    if not req.candidate_skills:
        raise HTTPException(status_code=400, detail="Candidate skills cannot be empty.")
    if not req.job_description:
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    try:
        result = analyze_skill_gap(req.candidate_skills, req.job_description)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"success": True, "data": result}


# ── Interview Questions ───────────────────────────────────────────────────────

@router.post("/interview-questions")
async def interview_questions(req: InterviewRequest):
    """
    Generate tailored interview questions for a specific role.
    """
    if not req.target_role:
        raise HTTPException(status_code=400, detail="Target role is required.")

    try:
        result = generate_interview_questions(
            candidate_skills=req.skills,
            experience_years=req.experience_years,
            projects=req.projects,
            target_role=req.target_role,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"success": True, "data": result}


# ── Learning Roadmap ──────────────────────────────────────────────────────────

@router.post("/learning-roadmap")
async def learning_roadmap(req: RoadmapRequest):
    """
    Generate a personalized week-by-week learning roadmap.
    """
    if not req.target_role:
        raise HTTPException(status_code=400, detail="Target role is required.")

    try:
        result = generate_learning_roadmap(
            current_skills=req.current_skills,
            missing_skills=req.missing_skills,
            experience_years=req.experience_years,
            target_role=req.target_role,
            hours_per_week=req.hours_per_week,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"success": True, "data": result}
