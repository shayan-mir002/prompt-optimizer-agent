"""
app/api/dependencies.py
FastAPI dependency injection — constructs services and the orchestrator.
Services are built once and reused for the lifetime of the application
via a module-level singleton pattern.
"""
from __future__ import annotations
from functools import lru_cache

from app.core.config import get_settings
from app.services.bluesmind_client import BluesmindClient
from app.services.token_counter import TokenCounter
from app.services.cost_calculator import CostCalculator
from app.services.prompt_validator import PromptValidator
from app.services.prompt_analyzer import PromptAnalyzer
from app.services.skill_manager import SkillManager
from app.services.skill_selector import SkillSelector
from app.services.prompt_optimizer import PromptOptimizer
from app.services.execution_estimator import ExecutionEstimator
from app.services.manual_projection import ManualProjection
from app.services.manual_simulator import ManualSimulator
from app.services.report_generator import ReportGenerator
from app.services.orchestrator import OptimizationOrchestrator


@lru_cache()
def get_orchestrator() -> OptimizationOrchestrator:
    """Build and cache the orchestrator with all wired dependencies."""
    settings = get_settings()

    client = BluesmindClient(settings)
    token_counter = TokenCounter()
    cost_calculator = CostCalculator(settings)
    skill_manager = SkillManager(settings.SKILLS_DIR)

    return OptimizationOrchestrator(
        client=client,
        token_counter=token_counter,
        cost_calculator=cost_calculator,
        validator=PromptValidator(client),
        analyzer=PromptAnalyzer(client),
        skill_manager=skill_manager,
        skill_selector=SkillSelector(client, skill_manager),
        optimizer=PromptOptimizer(client, token_counter),
        execution_estimator=ExecutionEstimator(cost_calculator),
        manual_projection=ManualProjection(cost_calculator),
        manual_simulator=ManualSimulator(client, token_counter),
        report_generator=ReportGenerator(),
    )
