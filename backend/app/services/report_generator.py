"""
app/services/report_generator.py
Phase 11 — Assembles the final comprehensive report from all pipeline phases.
"""
from __future__ import annotations
from app.schemas.response import (
    FinalReport,
    AnalysisResult,
    ClarificationResult,
    SkillResult,
    OptimizedPromptResult,
    OptimizerAnalytics,
    ManualProjection,
    ComparisonResult,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class ReportGenerator:
    """Constructs the FinalReport from all upstream service outputs."""

    def generate(
        self,
        *,
        analysis: AnalysisResult,
        clarification: ClarificationResult,
        skill: SkillResult,
        optimized_prompt: OptimizedPromptResult,
        optimizer_analytics: OptimizerAnalytics,
        manual_projection: ManualProjection,
        comparison: ComparisonResult,
    ) -> FinalReport:

        logger.debug("Assembling final report")

        return FinalReport(
            # ── Optimized Prompt
            optimized_prompt=optimized_prompt.text,

            # ── Prompt Analysis
            intent=analysis.intent,
            prompt_type=analysis.prompt_type,
            complexity=analysis.complexity,
            completeness_score=analysis.completeness_score,
            quality_score=analysis.quality_score,
            ambiguity_level=analysis.ambiguity_level,
            missing_requirements=analysis.missing_information,

            # ── Skill
            selected_skill=skill.name,
            skill_full_name=skill.full_name,
            skill_reason=skill.reason,

            # ── Manual Workflow
            num_questions=clarification.num_questions,
            generated_questions=clarification.questions,
            raw_prompt_tokens=manual_projection.raw_prompt_tokens,
            decision_making_tokens=manual_projection.decision_making_tokens,
            estimated_question_tokens=manual_projection.question_generation_tokens,
            estimated_answer_tokens=manual_projection.estimated_answer_tokens,
            estimated_execution_tokens=manual_projection.estimated_execution_tokens,
            estimated_answer_analysis_tokens=manual_projection.estimated_answer_analysis_tokens,
            total_estimated_manual_tokens=manual_projection.total_estimated_manual_tokens,
            estimated_manual_cost=manual_projection.estimated_manual_cost,

            # ── Optimizer Workflow
            raw_prompt_tokens_opt=optimizer_analytics.raw_prompt_tokens,
            skill_selection_tokens=optimizer_analytics.skill_selection_tokens,
            optimization_tokens=optimizer_analytics.optimization_tokens,
            optimized_prompt_tokens=optimizer_analytics.optimized_prompt_tokens,
            estimated_optimizer_execution_tokens=optimizer_analytics.estimated_execution_tokens,
            total_optimizer_tokens=optimizer_analytics.total_optimizer_tokens,
            estimated_optimizer_cost=optimizer_analytics.estimated_optimizer_cost,
            estimated_execution_cost=optimizer_analytics.estimated_execution_cost,

            # ── Comparison
            manual_tokens=comparison.manual_tokens,
            optimizer_tokens_total=comparison.optimizer_tokens,
            tokens_saved=comparison.tokens_saved,
            percentage_reduction=comparison.percentage_reduction,
            estimated_cost_saved=comparison.estimated_cost_saved,
        )
