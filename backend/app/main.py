"""
app/main.py
FastAPI application factory.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.api.routes.optimize import router as optimize_router
from app.api.routes.meta import router as meta_router

setup_logging("INFO")
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.PROJECT_NAME)
    # Eagerly initialise the orchestrator (loads skills, warms tiktoken)
    from app.api.dependencies import get_orchestrator
    orch = get_orchestrator()
    logger.info(
        "SkillManager loaded %d skills from %s",
        orch._skill_manager.count,
        settings.SKILLS_DIR,
    )
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI Prompt Optimization Agent — 11-phase pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(optimize_router, prefix=settings.API_V1_PREFIX)
app.include_router(meta_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}
