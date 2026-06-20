"""
Resume Router — /api/resume/*
Handles PDF upload, text extraction, and analysis.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from agents.resume_analyzer import analyze_resume
from utils.pdf_parser import extract_text_from_bytes

router = APIRouter(prefix="/api/resume", tags=["Resume"])


class ResumeAnalysisResponse(BaseModel):
    success: bool
    data: dict
    message: str = ""


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    """
    Upload a PDF resume and get full analysis:
    - Extracted skills, experience, education
    - ATS score with breakdown
    - Improvement suggestions
    - Recommended roles
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Read file bytes
    pdf_bytes = await file.read()
    if len(pdf_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")

    # Extract text from PDF
    try:
        resume_text = extract_text_from_bytes(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Run Resume Analyzer Agent
    try:
        result = analyze_resume(resume_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return ResumeAnalysisResponse(
        success=True,
        data=result,
        message="Resume analyzed successfully",
    )


@router.post("/analyze-text", response_model=ResumeAnalysisResponse)
async def analyze_resume_text_endpoint(payload: dict):
    """
    Analyze resume from plain text (for testing without a PDF).
    Body: { "text": "resume text here" }
    """
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")

    try:
        result = analyze_resume(text)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=422, detail=str(e))

    return ResumeAnalysisResponse(success=True, data=result)
