/**
 * API Client — single place where the frontend talks to the FastAPI backend.
 * Every component imports from here instead of calling fetch/axios directly.
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Gemini calls + retries can take a while
});

/**
 * Unwraps axios errors into a clean, readable message.
 * FastAPI's HTTPException puts the message in error.response.data.detail.
 */
function unwrapError(error) {
  if (error.response?.data?.detail) {
    return new Error(error.response.data.detail);
  }
  if (error.code === "ECONNABORTED") {
    return new Error("Request timed out. The AI may be taking longer than usual — try again.");
  }
  if (error.message === "Network Error") {
    return new Error("Can't reach the backend. Is it running on " + API_BASE_URL + "?");
  }
  return error;
}

// ── Resume Analyzer ───────────────────────────────────────────────────────────

export async function analyzeResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await client.post("/api/resume/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data; // unwrap { success, data, message }
  } catch (error) {
    throw unwrapError(error);
  }
}

// ── Job Matching ──────────────────────────────────────────────────────────────

export async function matchJobs({ skills, recommendedRoles, experienceYears, currentRole, country }) {
  try {
    const { data } = await client.post("/api/agents/match-jobs", {
      skills,
      recommended_roles: recommendedRoles,
      experience_years: experienceYears || 0,
      current_role: currentRole || "",
      country: country || "in",
    });
    return data.data;
  } catch (error) {
    throw unwrapError(error);
  }
}

// ── Skill Gap ─────────────────────────────────────────────────────────────────

export async function analyzeSkillGap({ candidateSkills, jobDescription }) {
  try {
    const { data } = await client.post("/api/agents/skill-gap", {
      candidate_skills: candidateSkills,
      job_description: jobDescription,
    });
    return data.data;
  } catch (error) {
    throw unwrapError(error);
  }
}

// ── Interview Questions ───────────────────────────────────────────────────────

export async function generateInterviewQuestions({ skills, experienceYears, projects, targetRole }) {
  try {
    const { data } = await client.post("/api/agents/interview-questions", {
      skills,
      experience_years: experienceYears || 0,
      projects: projects || [],
      target_role: targetRole,
    });
    return data.data;
  } catch (error) {
    throw unwrapError(error);
  }
}

// ── Learning Roadmap ──────────────────────────────────────────────────────────

export async function generateLearningRoadmap({ currentSkills, missingSkills, experienceYears, targetRole, hoursPerWeek }) {
  try {
    const { data } = await client.post("/api/agents/learning-roadmap", {
      current_skills: currentSkills,
      missing_skills: missingSkills,
      experience_years: experienceYears || 0,
      target_role: targetRole,
      hours_per_week: hoursPerWeek || 10,
    });
    return data.data;
  } catch (error) {
    throw unwrapError(error);
  }
}
