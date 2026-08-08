"""
app/core/config.py
Centralised settings loaded from the .env file.
"""
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


BASE_DIR = Path(__file__).resolve().parent.parent          # → app/
BACKEND_DIR = BASE_DIR.parent                              # → backend/


class Settings(BaseSettings):
    # ── AI Provider (OpenAI-compatible chat completions API) ─────────────────
    API_KEY: str
    API_BASE_URL: str = "https://api.groq.com/openai/v1"
    API_MODEL: str = "llama-3.3-70b-versatile"

    # ── Pricing (llama-3.3-70b-versatile @ Groq, per 1 000 tokens) ───────────
    INPUT_COST_PER_1K: float = 0.00059         # $0.59  / 1 M input tokens
    OUTPUT_COST_PER_1K: float = 0.00079        # $0.79  / 1 M output tokens
    CACHED_INPUT_COST_PER_1K: float = 0.00059  # conservative — no cache estimate

    # ── Skills directory (absolute path resolved at runtime) ──────────────────
    SKILLS_DIR: str = str(BASE_DIR / "skills")

    # ── API server ────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI Prompt Optimization Agent"

    model_config = {"env_file": str(BACKEND_DIR / ".env"), "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
