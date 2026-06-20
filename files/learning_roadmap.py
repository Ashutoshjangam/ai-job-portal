"""
Learning Roadmap Agent
──────────────────────
Creates a personalized week-by-week learning roadmap to bridge
the skill gap for a target role.
"""

import json
from utils.llm_client import ask_llm_json


_ROADMAP_PROMPT = """
You are a career development coach and learning path designer.

Create a personalized learning roadmap for this candidate to become job-ready
for their target role.

CANDIDATE:
Current Skills: {current_skills}
Missing Skills: {missing_skills}
Experience: {experience_years} years
Target Role: {target_role}
Available Time: {hours_per_week} hours/week

Return a JSON object with EXACTLY this structure:
{{
  "target_role": "{target_role}",
  "total_weeks": 12,
  "hours_per_week": {hours_per_week},
  "phases": [
    {{
      "phase": 1,
      "title": "Foundation",
      "weeks": "1-3",
      "goal": "What you will achieve by end of this phase",
      "topics": [
        {{
          "skill": "Docker",
          "resources": [
            {{
              "type": "course",
              "name": "Docker & Kubernetes: The Practical Guide",
              "platform": "Udemy",
              "url": "https://udemy.com",
              "free": false,
              "duration_hours": 20
            }},
            {{
              "type": "docs",
              "name": "Official Docker Getting Started",
              "platform": "docs.docker.com",
              "url": "https://docs.docker.com/get-started/",
              "free": true,
              "duration_hours": 3
            }}
          ],
          "practice_project": "Containerize a simple Flask app"
        }}
      ]
    }}
  ],
  "milestones": [
    {{
      "week": 4,
      "milestone": "Build and deploy your first containerized app",
      "proof_of_work": "GitHub repo with Dockerfile + README"
    }}
  ],
  "free_resources_summary": [
    "Resource 1 (free)",
    "Resource 2 (free)"
  ],
  "estimated_job_ready_date": "3 months from today",
  "motivational_note": "Personalized encouragement for this candidate"
}}

Rules:
- Create 3 phases covering the missing skills progressively.
- Mix free and paid resources — always include at least 1 free option per skill.
- practice_project should be realistic and portfolio-worthy.
- milestones should be concrete and verifiable.
- resources must include real, well-known platforms (Udemy, Coursera, YouTube, freeCodeCamp, official docs).
"""


def generate_learning_roadmap(
    current_skills: list[str],
    missing_skills: list[dict],
    experience_years: int,
    target_role: str,
    hours_per_week: int = 10,
) -> dict:
    """
    Generate a personalized learning roadmap.

    Args:
        current_skills:   Skills the candidate already has.
        missing_skills:   List of missing skill dicts from Skill Gap Agent.
        experience_years: Years of experience.
        target_role:      The job role to prepare for.
        hours_per_week:   How many hours per week candidate can study.

    Returns:
        Dict with phased roadmap, resources, and milestones.
    """
    if not missing_skills:
        return {
            "target_role": target_role,
            "message": "Great news! No significant skill gaps found for this role.",
            "phases": [],
            "milestones": [],
        }

    # Extract skill names from missing_skills (handles both str and dict)
    missing_names = [
        s["skill"] if isinstance(s, dict) else s
        for s in missing_skills[:8]  # limit to top 8
    ]

    prompt = _ROADMAP_PROMPT.format(
        current_skills=", ".join(current_skills[:15]),
        missing_skills=", ".join(missing_names),
        experience_years=experience_years or 0,
        target_role=target_role,
        hours_per_week=hours_per_week,
    )

    raw_json = ask_llm_json(prompt)

    try:
        result = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}")

    return result
