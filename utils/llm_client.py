"""
LLM Client — single place to talk to the AI.
Swap provider here without touching any agent code.
"""

import os
import time
from google import genai
from google.genai import types
from google.genai.errors import ServerError
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")
_MODEL_NAME = "gemini-2.5-flash"

# Retry settings for transient errors (503 overload, etc.)
_MAX_RETRIES = 3
_BASE_DELAY_SECONDS = 2  # doubles each retry: 2s, 4s, 8s


def _get_client() -> genai.Client:
    if not _api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. "
            "Copy .env.example -> .env and add your key from "
            "https://aistudio.google.com/apikey"
        )
    return genai.Client(api_key=_api_key)


def ask_llm(prompt: str, temperature: float = 0.3, max_output_tokens: int = 8192) -> str:
    """
    Send a prompt to the LLM and return the text response.
    Automatically retries on transient server errors (e.g. 503 overload)
    with exponential backoff, since these usually resolve within seconds.

    Args:
        prompt:             The full prompt string.
        temperature:        0.0 = deterministic, 1.0 = creative.
        max_output_tokens:  Max tokens in the response. Our JSON schemas are
                             detailed (resume analysis, roadmaps, etc.) so this
                             defaults high to avoid truncated/invalid JSON.

    Returns:
        The model response as a plain string.

    Raises:
        RuntimeError: If the API key is missing, the response has no text,
                      or all retries are exhausted on a server error.
    """
    client = _get_client()
    last_error: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=_MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )

            text = response.text
            if text is None:
                finish_reason = None
                try:
                    finish_reason = response.candidates[0].finish_reason
                except (IndexError, AttributeError):
                    pass
                raise RuntimeError(
                    f"Gemini returned no text (finish_reason={finish_reason}). "
                    "Try increasing max_output_tokens or simplifying the prompt."
                )

            return text.strip()

        except ServerError as e:
            # Transient issue on Google's side (503 UNAVAILABLE, etc.) — retry.
            last_error = e
            if attempt < _MAX_RETRIES - 1:
                delay = _BASE_DELAY_SECONDS * (2 ** attempt)
                print(f"[llm_client] Gemini overloaded (attempt {attempt + 1}/{_MAX_RETRIES}). Retrying in {delay}s...")
                time.sleep(delay)
            continue

    # All retries exhausted
    raise RuntimeError(
        "Gemini's servers are temporarily overloaded and didn't recover after "
        f"{_MAX_RETRIES} attempts. This is on Google's end, not your code — "
        f"please wait a minute and try again. (Last error: {last_error})"
    )


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
