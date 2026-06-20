# AI Job Search Copilot

An AI-powered job search assistant with 5 agents that help you go from "uploading a resume" to "walking into an interview prepared."

## What it does

- **Resume Analyzer** — Upload a PDF resume, get an ATS compatibility score, extracted skills, strengths, and concrete improvements.
- **Job Matching** — Finds live job listings (via Adzuna) and scores each one against your profile.
- **Skill Gap Analysis** — Paste any job description and see exactly which skills you're missing.
- **Interview Question Generator** — Get role-specific technical, system design, behavioral, and HR questions.
- **Learning Roadmap** — A phased, week-by-week plan with real courses/resources to close your skill gaps.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Google Gemini API (gemini-2.5-flash) |
| Job data | Adzuna API |
| PDF parsing | PyMuPDF |

## Project structure

```
ai-job-copilot/
├── backend/
│   ├── agents/        # The 5 AI agents
│   ├── routers/        # FastAPI route handlers
│   ├── utils/           # PDF parsing + LLM client
│   └── main.py          # FastAPI app entry point
└── frontend/
    ├── src/
    │   ├── pages/        # One page per agent
    │   ├── components/   # Shared UI pieces
    │   ├── context/      # Resume profile state
    │   └── api/          # Backend API client
    └── index.html
```

## Running locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # then add your real API keys
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to test the API directly.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Environment variables

Both `backend/.env` and `frontend/.env` are required and are **not** committed to this repo (see `.gitignore`). Copy the `.env.example` files and fill in your own keys:

- `GEMINI_API_KEY` — free at https://aistudio.google.com/apikey
- `ADZUNA_APP_ID` / `ADZUNA_API_KEY` — free at https://developer.adzuna.com/signup

## License

Personal project — built for learning.
