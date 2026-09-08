"""
app/api/routes/meta.py
Read-only metadata endpoint so the UI can render model + pricing without
hardcoding stale values in the frontend.
"""
from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["Meta"])

settings = get_settings()


@router.get("/config", summary="Model and pricing configuration")
async def get_config():
    """Return the AI provider model and per-1000-token pricing currently in use."""
    return {
        "model": settings.API_MODEL,
        "base_url": settings.API_BASE_URL,
        "pricing_per_1k": {
            "input": settings.INPUT_COST_PER_1K,
            "output": settings.OUTPUT_COST_PER_1K,
            "cached_input": settings.CACHED_INPUT_COST_PER_1K,
        },
    }
