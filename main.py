"""
AI Job Search Copilot — FastAPI Backend
========================================
Run with:  uvicorn main:app --reload --port 8000
Docs at:   http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.resume import router as resume_router
from routers.agents import router as agents_router

app = FastAPI(
    title="AI Job Search Copilot",
    description="5 AI agents to help you land your next job faster.",
    version="1.0.0",
)

# Allow React frontend (localhost:5173) to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(resume_router)
app.include_router(agents_router)


@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "AI Job Search Copilot API is live 🚀",
        "docs": "/docs",
    }


@app.get("/api/health")
def api_health():
    return {"status": "ok", "agents": ["resume_analyzer", "job_matching", "skill_gap", "interview_questions", "learning_roadmap"]}
