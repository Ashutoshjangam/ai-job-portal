"""
Skill Gap Agent
───────────────
Compares the candidate's current skills against a target job description
and identifies what's missing, what matches, and how critical each gap is.
"""

import json
from utils.llm_client import ask_llm_json


_SKILL_GAP_PROMPT = """
You are a technical recruiter and career advisor. 

Compare the candidate's skills against the job requirements and return a JSON object with EXACTLY this structure:

{{
  "job_title": "Extracted or inferred job title",
  "match_percentage": 65,
  "matched_skills": [
    {{ "skill": "Python", "proficiency": "strong" }}
  ],
  "missing_skills": [
    {{
      "skill": "Docker",
      "importance": "critical",
      "reason": "Why this skill matters for the role",
      "learn_in": "2-4 weeks"
    }}
  ],
  "nice_to_have_missing": [
    {{ "skill": "Kubernetes", "importance": "optional" }}
  ],
  "experience_gap": "Candidate has 1 year, role requires 3 years",
  "education_match": true,
  "overall_verdict": "Good match with some upskilling needed",
  "quick_wins": ["skill you can learn fast to boost match %"],
  "summary": "2-3 sentence summary of fit"
}}

CANDIDATE SKILLS:
{candidate_skills}

JOB DESCRIPTION / REQUIRED SKILLS:
{job_description}

Rules:
- match_percentage must be integer 0-100.
- importance must be one of: "critical", "important", "optional".
- Be realistic — do not overstate the match.
- missing_skills should only list skills explicitly required or strongly implied by the job description.
"""


def analyze_skill_gap(candidate_skills: list[str], job_description: str) -> dict:
    """
    Identify skill gaps between the candidate and a job description.

    Args:
        candidate_skills: List of skills extracted by the Resume Analyzer agent.
        job_description:  Raw text of the job posting or list of required skills.

    Returns:
        Dict with matched skills, missing skills, and match percentage.
    """
    if not candidate_skills:
        raise ValueError("No candidate skills provided.")
    if not job_description or len(job_description.strip()) < 10:
        raise ValueError("Job description is too short.")

    skills_str = ", ".join(candidate_skills) if isinstance(candidate_skills, list) else candidate_skills

    prompt = _SKILL_GAP_PROMPT.format(
        candidate_skills=skills_str,
        job_description=job_description[:3000],
    )

    raw_json = ask_llm_json(prompt)

    try:
        result = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}")

    return result
