"""
LLM Client — single place to talk to the AI.
Swap provider here without touching any agent code.
"""

import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")
_MODEL_NAME = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    if not _api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. "
            "Copy .env.example -> .env and add your key from "
            "https://aistudio.google.com/apikey"
        )
    return genai.Client(api_key=_api_key)


def ask_llm(prompt: str, temperature: float = 0.3) -> str:
    """
    Send a prompt to the LLM and return the text response.

    Args:
        prompt:      The full prompt string.
        temperature: 0.0 = deterministic, 1.0 = creative.

    Returns:
        The model response as a plain string.
    """
    client = _get_client()
    response = client.models.generate_content(
        model=_MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=2048,
        ),
    )
    return response.text.strip()


def ask_llm_json(prompt: str) -> str:
    """
    Like ask_llm but instructs the model to respond ONLY with valid JSON.
    Strips markdown code fences if the model adds them anyway.
    """
    json_prompt = (
        prompt
        + "\n\nIMPORTANT: Respond with ONLY valid JSON. "
        "No explanation, no markdown, no code fences."
    )
    raw = ask_llm(json_prompt, temperature=0.1)

    # Strip ```json ... ``` fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    return raw.strip()
