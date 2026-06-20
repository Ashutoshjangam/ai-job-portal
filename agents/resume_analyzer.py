"""
Resume Analyzer Agent
─────────────────────
Given raw resume text, this agent:
  1. Extracts skills, experience, education, and projects.
  2. Generates an ATS compatibility score (0-100).
  3. Suggests concrete improvements.

Returns a structured dict ready to send to the frontend.
"""

import json
from utils.llm_client import ask_llm_json


# ── Prompts ──────────────────────────────────────────────────────────────────

_ANALYZE_PROMPT = """
You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.

Analyze the resume below and return a JSON object with EXACTLY this structure:

{{
  "candidate_name": "Full name from resume or 'Unknown'",
  "contact": {{
    "email": "email or null",
    "phone": "phone or null",
    "linkedin": "linkedin URL or null",
    "github": "github URL or null",
    "location": "city, country or null"
  }},
  "summary": "2-3 sentence professional summary of the candidate",
  "experience_years": 0,
  "current_role": "Most recent job title or null",
  "skills": {{
    "technical": ["list", "of", "technical", "skills"],
    "soft": ["communication", "leadership", "etc"],
    "tools": ["VS Code", "Jira", "etc"],
    "languages": ["Python", "JavaScript", "etc"]
  }},
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2022 - Dec 2023",
      "highlights": ["key achievement 1", "key achievement 2"]
    }}
  ],
  "education": [
    {{
      "degree": "B.Tech Computer Science",
      "institution": "University Name",
      "year": "2022"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "1 sentence description",
      "tech_stack": ["Python", "React"]
    }}
  ],
  "certifications": ["list of certifications or empty array"],
  "ats_score": 72,
  "ats_breakdown": {{
    "keyword_density": 70,
    "formatting": 80,
    "quantified_achievements": 60,
    "contact_completeness": 90,
    "section_structure": 75
  }},
  "strengths": ["3-5 strong points about this resume"],
  "improvements": [
    {{
      "priority": "high",
      "issue": "What is wrong",
      "fix": "Exactly how to fix it"
    }}
  ],
  "recommended_roles": ["Python Developer", "Backend Engineer", "Data Analyst"]
}}

RESUME TEXT:
─────────────────────────────────────
{resume_text}
─────────────────────────────────────

Rules:
- ats_score must be an integer between 0 and 100.
- All ats_breakdown scores must be integers between 0 and 100.
- improvements should have at most 5 items, prioritized by "high", "medium", "low".
- recommended_roles should have 3-5 roles that genuinely match the resume.
- Be honest and accurate — do not inflate scores.
"""


# ── Agent function ────────────────────────────────────────────────────────────

def analyze_resume(resume_text: str) -> dict:
    """
    Analyze a resume and return structured insights.

    Args:
        resume_text: Plain text extracted from the resume PDF.

    Returns:
        Dict with skills, ATS score, improvements, and recommended roles.

    Raises:
        ValueError: If the LLM response cannot be parsed as JSON.
    """
    if not resume_text or len(resume_text.strip()) < 50:
        raise ValueError("Resume text is too short to analyze.")

    # Trim to avoid hitting token limits (keep first ~6000 chars which is ~1500 tokens)
    trimmed = resume_text[:6000]

    prompt = _ANALYZE_PROMPT.format(resume_text=trimmed)
    raw_json = ask_llm_json(prompt)

    try:
        result = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {raw_json[:300]}")

    # Validate required keys exist
    required_keys = ["candidate_name", "skills", "ats_score", "improvements", "recommended_roles"]
    missing = [k for k in required_keys if k not in result]
    if missing:
        raise ValueError(f"LLM response missing required fields: {missing}")

    return result
