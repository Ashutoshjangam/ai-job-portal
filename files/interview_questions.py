"""
Interview Question Agent
────────────────────────
Generates tailored interview questions based on the candidate's resume
and a target job role. Covers technical, behavioral, and HR questions.
"""

import json
from utils.llm_client import ask_llm_json


_INTERVIEW_PROMPT = """
You are a senior technical interviewer preparing questions for a candidate.

Generate a comprehensive set of interview questions for this candidate applying
for the specified role.

CANDIDATE PROFILE:
Skills: {skills}
Experience: {experience_years} years
Projects: {projects}
Target Role: {target_role}

Return a JSON object with EXACTLY this structure:
{{
  "role": "{target_role}",
  "total_questions": 15,
  "sections": [
    {{
      "category": "Technical",
      "questions": [
        {{
          "question": "Explain the difference between list and tuple in Python.",
          "difficulty": "easy",
          "tip": "Mention mutability, use cases, and performance.",
          "expected_duration_minutes": 2
        }}
      ]
    }},
    {{
      "category": "System Design",
      "questions": [...]
    }},
    {{
      "category": "Behavioral (STAR method)",
      "questions": [...]
    }},
    {{
      "category": "HR & Culture Fit",
      "questions": [...]
    }}
  ],
  "preparation_tips": [
    "Tip 1 specific to this candidate's profile",
    "Tip 2"
  ]
}}

Rules:
- Generate exactly 5 Technical, 3 System Design, 4 Behavioral, 3 HR questions.
- difficulty must be one of: "easy", "medium", "hard".
- Questions must be SPECIFIC to the target role and candidate's background.
- Behavioral questions should follow STAR format (Situation, Task, Action, Result).
- preparation_tips should be 3-5 actionable tips personalized to this candidate.
"""


def generate_interview_questions(
    candidate_skills: list[str],
    experience_years: int,
    projects: list[dict],
    target_role: str,
) -> dict:
    """
    Generate interview questions for a specific role.

    Args:
        candidate_skills:  Skills from Resume Analyzer.
        experience_years:  Years of experience.
        projects:          Projects list from Resume Analyzer.
        target_role:       The job role to prepare for.

    Returns:
        Dict with categorized questions and preparation tips.
    """
    if not target_role:
        raise ValueError("Target role is required.")

    project_names = [p.get("name", "") for p in (projects or [])[:3]]
    projects_str  = ", ".join(project_names) if project_names else "None listed"

    prompt = _INTERVIEW_PROMPT.format(
        skills=", ".join(candidate_skills[:20]),
        experience_years=experience_years or 0,
        projects=projects_str,
        target_role=target_role,
    )

    raw_json = ask_llm_json(prompt)

    try:
        result = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}")

    return result
