"""
Job Matching Agent
──────────────────
Fetches live job listings from Adzuna API and scores each one
against the candidate's resume profile.
"""

import os
import json
import requests
from dotenv import load_dotenv
from utils.llm_client import ask_llm_json

load_dotenv()

ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_API_KEY = os.getenv("ADZUNA_API_KEY", "")
ADZUNA_BASE    = "https://api.adzuna.com/v1/api/jobs"

# Country code → Adzuna region
COUNTRY_MAP = {
    "india": "in",
    "us": "us",
    "uk": "gb",
    "australia": "au",
    "canada": "ca",
}


# ── Adzuna fetcher ────────────────────────────────────────────────────────────

def fetch_jobs_from_adzuna(
    role: str,
    country: str = "in",
    results: int = 10,
) -> list[dict]:
    """
    Fetch live job listings from the Adzuna API.

    Args:
        role:    Job title to search for, e.g. "Python Developer".
        country: Two-letter country code (default "in" for India).
        results: Number of jobs to fetch (max 50 per request).

    Returns:
        List of raw job dicts from Adzuna.
    """
    if not ADZUNA_APP_ID or not ADZUNA_API_KEY:
        # Return mock data if API keys not set (for development)
        return _mock_jobs(role)

    url = f"{ADZUNA_BASE}/{country}/search/1"
    params = {
        "app_id":         ADZUNA_APP_ID,
        "app_key":        ADZUNA_API_KEY,
        "results_per_page": results,
        "what":           role,
        "content-type":   "application/json",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])
    except requests.RequestException as e:
        print(f"[JobMatchingAgent] Adzuna API error: {e}")
        return _mock_jobs(role)


def _mock_jobs(role: str) -> list[dict]:
    """Return mock jobs when API keys aren't configured yet."""
    return [
        {
            "id": "mock_001",
            "title": f"Senior {role}",
            "company": {"display_name": "TechCorp India"},
            "location": {"display_name": "Pune, India"},
            "description": f"We are looking for an experienced {role} with strong Python, REST APIs, and cloud experience. 3+ years required.",
            "salary_min": 800000,
            "salary_max": 1400000,
            "redirect_url": "https://adzuna.com",
            "created": "2026-06-01T00:00:00Z",
        },
        {
            "id": "mock_002",
            "title": f"{role}",
            "company": {"display_name": "StartupXYZ"},
            "location": {"display_name": "Bangalore, India"},
            "description": f"Exciting opportunity for a {role}. Skills: Python, FastAPI, Docker, PostgreSQL, CI/CD. 1-3 years experience.",
            "salary_min": 600000,
            "salary_max": 1000000,
            "redirect_url": "https://adzuna.com",
            "created": "2026-06-10T00:00:00Z",
        },
        {
            "id": "mock_003",
            "title": f"Junior {role}",
            "company": {"display_name": "MNC Solutions"},
            "location": {"display_name": "Hyderabad, India"},
            "description": f"Entry-level {role} position. Python, SQL, Git required. Good communication skills needed.",
            "salary_min": 400000,
            "salary_max": 700000,
            "redirect_url": "https://adzuna.com",
            "created": "2026-06-15T00:00:00Z",
        },
    ]


# ── Scoring ───────────────────────────────────────────────────────────────────

_SCORE_PROMPT = """
You are a job matching algorithm. Score how well the candidate's profile matches
each job listing.

CANDIDATE PROFILE:
Skills: {skills}
Experience: {experience_years} years
Current Role: {current_role}

JOB LISTINGS (JSON):
{jobs_json}

Return a JSON array where each element is:
{{
  "job_id": "same id from input",
  "match_score": 78,
  "matched_skills": ["Python", "SQL"],
  "missing_skills": ["Docker"],
  "why_good_fit": "One sentence explanation",
  "salary_estimate": "₹8-12 LPA or 'Not listed'"
}}

Rules:
- match_score must be integer 0-100.
- Only output the JSON array, nothing else.
- Be realistic with match scores.
"""


def score_jobs(
    jobs: list[dict],
    candidate_skills: list[str],
    experience_years: int,
    current_role: str,
) -> list[dict]:
    """
    Use the LLM to score each job against the candidate's profile.

    Returns a list of job dicts enriched with match scores.
    """
    # Simplify jobs for the prompt (avoid huge tokens)
    slim_jobs = [
        {
            "id":          j.get("id", f"job_{i}"),
            "title":       j.get("title", ""),
            "company":     j.get("company", {}).get("display_name", ""),
            "location":    j.get("location", {}).get("display_name", ""),
            "description": j.get("description", "")[:500],
        }
        for i, j in enumerate(jobs)
    ]

    prompt = _SCORE_PROMPT.format(
        skills=", ".join(candidate_skills[:30]),
        experience_years=experience_years,
        current_role=current_role or "Not specified",
        jobs_json=json.dumps(slim_jobs, indent=2),
    )

    raw_json = ask_llm_json(prompt)

    try:
        scores = json.loads(raw_json)
    except json.JSONDecodeError:
        scores = []

    # Merge scores back into original job data
    score_map = {s["job_id"]: s for s in scores}
    enriched = []
    for i, job in enumerate(jobs):
        job_id = job.get("id", f"job_{i}")
        score_data = score_map.get(job_id, {"match_score": 0})
        enriched.append({**job, **score_data})

    # Sort by match score descending
    enriched.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return enriched


# ── Main entry point ──────────────────────────────────────────────────────────

def find_matching_jobs(
    candidate_skills: list[str],
    recommended_roles: list[str],
    experience_years: int = 0,
    current_role: str = "",
    country: str = "in",
) -> list[dict]:
    """
    Fetch jobs for each recommended role and return scored + sorted list.
    """
    all_jobs = []
    seen_ids = set()

    for role in recommended_roles[:3]:  # max 3 roles to stay within rate limits
        jobs = fetch_jobs_from_adzuna(role, country=country, results=5)
        for job in jobs:
            jid = job.get("id", "")
            if jid not in seen_ids:
                seen_ids.add(jid)
                all_jobs.append(job)

    if not all_jobs:
        return []

    return score_jobs(all_jobs, candidate_skills, experience_years, current_role)
