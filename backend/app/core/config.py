"""
app/core/config.py
Centralised settings loaded from the .env file.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent.parent          # → app/
BACKEND_DIR = BASE_DIR.parent                              # → backend/

try:
    # Generated at desktop-build time (app/core/secret.py); not present in dev.
    # Provides an obfuscated fallback key so the standalone .exe works out of
    # the box. Environment variables and backend/.env still take precedence.
    from app.core import secret as _secret

    _EMBEDDED_API_KEY: str = _secret.get_api_key()
except Exception:
    _EMBEDDED_API_KEY = ""


class Settings(BaseSettings):
    # ── AI Provider (OpenAI-compatible chat completions API) ─────────────────
    API_KEY: str = _EMBEDDED_API_KEY
    API_BASE_URL: str = "https://api.groq.com/openai/v1"
    API_MODEL: str = "openai/gpt-oss-120b"

    # ── Pricing (openai/gpt-oss-120b @ Groq, per 1 000 tokens) ───────────────
    INPUT_COST_PER_1K: float = 0.00015         # $0.15  / 1 M input tokens
    OUTPUT_COST_PER_1K: float = 0.00060        # $0.60  / 1 M output tokens
    CACHED_INPUT_COST_PER_1K: float = 0.00015  # conservative — no cache estimate

    # ── Skills directory (absolute path resolved at runtime) ──────────────────
    SKILLS_DIR: str = str(BASE_DIR / "skills")

    # ── API server ────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI Prompt Optimization Agent"

    model_config = {"env_file": str(BACKEND_DIR / ".env"), "extra": "ignore"}

    @field_validator("API_KEY")
    @classmethod
    def _api_key_required(cls, v: str) -> str:
        if not v:
            raise ValueError(
                "API key is not configured. Set API_KEY in backend/.env "
                "or rebuild the desktop app with an embedded key."
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()
