"""
app/services/orchestrator.py
Master coordinator for the two-stage optimization flow.

Stage 1 — analyze(raw_prompt)
    Validates the prompt, analyzes clarity, plans how many clarification
    questions are needed, generates those questions, and projects the total
    tokens/cost that a MANUAL workflow would have consumed. Returns a
    PreOptimizationResponse. The full pipeline is NOT run yet.

Stage 2 — optimize(raw_prompt, pre_analysis)
    Selects the best skill, generates the optimized prompt, estimates the
    tokens required to execute it, aggregates the optimizer token usage
    (including input tokens: prompt text, decision making, question
    generation), and compares before-vs-after to report tokens & cost saved.
"""
from __future__ import annotations
import json
from typing import AsyncGenerator, List, Optional

from app.services.bluesmind_client import BluesmindClient
from app.services.token_counter import TokenCounter
from app.services.cost_calculator import CostCalculator
from app.services.prompt_validator import PromptValidator, ValidationOutcome
from app.services.prompt_analyzer import PromptAnalyzer, AnalysisOutcome
from app.services.skill_manager import SkillManager
from app.services.skill_selector import SkillSelector, SelectionOutcome
from app.services.prompt_optimizer import PromptOptimizer, OptimizationOutcome
from app.services.execution_estimator import ExecutionEstimator
from app.services.manual_projection import ManualProjection
from app.services.manual_simulator import ManualSimulator
from app.services.report_generator import ReportGenerator
from app.utils.helpers import extract_json, extract_int
from app.core.logging import get_logger
from app.schemas.response import (
    OptimizeResponse,
    PreOptimizationResponse,
    ValidationResult,
    AnalysisResult,
    ClarificationResult,
    SkillResult,
    OptimizedPromptResult,
    ExecutionEstimationResult,
    OptimizerAnalytics,
    ManualProjection as ManualProjectionSchema,
    ComparisonResult,
)

logger = get_logger(__name__)

# Estimated tokens per answer for clarification questions
AVG_ANSWER_TOKENS = 75


class OptimizationOrchestrator:
    """
    Single entry point for the two-stage optimization flow.
    Each phase is handled by a dedicated service; this class only coordinates.
    """

    def __init__(
        self,
        client: BluesmindClient,
        token_counter: TokenCounter,
        cost_calculator: CostCalculator,
        validator: PromptValidator,
        analyzer: PromptAnalyzer,
        skill_manager: SkillManager,
        skill_selector: SkillSelector,
        optimizer: PromptOptimizer,
        execution_estimator: ExecutionEstimator,
        manual_projection: ManualProjection,
        manual_simulator: ManualSimulator,
        report_generator: ReportGenerator,
    ) -> None:
        self._client = client
        self._counter = token_counter
        self._calc = cost_calculator
        self._validator = validator
        self._analyzer = analyzer
        self._skill_manager = skill_manager
        self._skill_selector = skill_selector
        self._optimizer = optimizer
        self._estimator = execution_estimator
        self._manual = manual_projection
        self._sim = manual_simulator
        self._reporter = report_generator

    @staticmethod
    def _log_tokens(
        stage: str,
        *,
        input_tokens: int,
        output_tokens: int,
        subtotal: int,
        running_total: Optional[int] = None,
        formula: str = "",
    ) -> None:
        """Debug logging for every token calculation stage (req: traceability)."""
        msg = (
            f"[TOKENS] {stage}: input={input_tokens} output={output_tokens} "
            f"subtotal={subtotal}"
        )
        if running_total is not None:
            msg += f" running_total={running_total}"
        if formula:
            msg += f' formula="{formula}"'
        logger.info(msg)

    # ══ Stage 1 — Analysis (NO full pipeline) ════════════════════════════════

    async def analyze(self, raw_prompt: str) -> PreOptimizationResponse:
        """Validate → analyze clarity → plan & generate questions → project
        the manual (before-optimization) token cost. Stops here."""
        logger.info("=== Stage 1: pre-optimization analysis started ===")

        # ── Phase 1: Raw token count ──────────────────────────────────────────
        raw_tokens = self._counter.count(raw_prompt)

        # ── Phase 2: Validation (analyze validity only) ───────────────────────
        validation_outcome = await self._validator.validate(raw_prompt)
        validation = ValidationResult(
            is_valid=validation_outcome.is_valid,
            errors=validation_outcome.errors,
            tokens_used=validation_outcome.tokens_used,
            input_tokens=validation_outcome.input_tokens,
            output_tokens=validation_outcome.output_tokens,
        )
        self._log_tokens(
            "Validation", input_tokens=validation_outcome.input_tokens,
            output_tokens=validation_outcome.output_tokens,
            subtotal=validation_outcome.tokens_used, formula="total = input + output",
        )
        logger.info("Stage 1 — valid: %s", validation.is_valid)

        if not validation.is_valid:
            return PreOptimizationResponse(
                raw_prompt_tokens=raw_tokens,
                validation=validation,
                prompt_is_clear=False,
                note="Prompt failed validation. No further analysis performed.",
            )

        # ── Phase 3: Clarity analysis (decision making) ───────────────────────
        analysis_outcome = await self._analyzer.analyze(raw_prompt)
        analysis = AnalysisResult(
            intent=analysis_outcome.intent,
            prompt_type=analysis_outcome.prompt_type,
            complexity=analysis_outcome.complexity,
            ambiguity_level=analysis_outcome.ambiguity_level,
            missing_information=analysis_outcome.missing_information,
            quality_score=analysis_outcome.quality_score,
            completeness_score=analysis_outcome.completeness_score,
            tokens_used=analysis_outcome.tokens_used,
            input_tokens=analysis_outcome.input_tokens,
            output_tokens=analysis_outcome.output_tokens,
        )
        self._log_tokens(
            "Prompt Analysis", input_tokens=analysis_outcome.input_tokens,
            output_tokens=analysis_outcome.output_tokens,
            subtotal=analysis_outcome.tokens_used, formula="total = input + output",
        )
        logger.info(
            "Stage 1 — clarity: %s (tokens: %d)",
            analysis.ambiguity_level, analysis.tokens_used,
        )

        # ── Phase 4: Clarification (count first, then generate questions) ─────
        clarification = await self._plan_and_generate_questions(
            raw_prompt, analysis_outcome
        )
        self._log_tokens(
            "Question Generation",
            input_tokens=0, output_tokens=0,
            subtotal=clarification.question_generation_tokens,
            formula="count_call_total + generate_call_total",
        )
        logger.info(
            "Stage 1 — questions planned/generated: %d (tokens: %d)",
            clarification.num_questions, clarification.question_generation_tokens,
        )

        # ── Phase 9: Manual (before-optimization) projection ──────────────────
        # Simulate the manual workflow with REAL LLM calls so answer analysis
        # and execution tokens are measured, not guessed.
        sim_outcome = await self._sim.simulate(
            raw_prompt, clarification.questions, analysis_outcome
        )
        # Surface the real (LLM-measured) answer tokens in the clarification too
        if sim_outcome.answer_tokens is not None:
            clarification.estimated_answer_tokens = sim_outcome.answer_tokens
        manual_outcome = self._manual.project(
            raw_prompt_tokens=raw_tokens,
            num_questions=clarification.num_questions,
            question_generation_tokens=clarification.question_generation_tokens,
            analysis=analysis_outcome,
            sim=sim_outcome,
        )
        manual_projection = self._to_manual_schema(manual_outcome)
        self._log_tokens(
            "Manual Execution (projection)",
            input_tokens=manual_projection.estimated_answer_tokens
            + manual_projection.raw_prompt_tokens,
            output_tokens=manual_projection.question_generation_tokens
            + manual_projection.estimated_execution_tokens,
            subtotal=manual_projection.total_estimated_manual_tokens,
            formula="raw + questions + answers + execution",
        )
        logger.info(
            "Stage 1 — manual (before optimization) total tokens: %d  cost: $%.6f",
            manual_projection.total_estimated_manual_tokens,
            manual_projection.estimated_manual_cost,
        )

        note = (
            f"Total tokens before the prompt is optimized: "
            f"{manual_projection.total_estimated_manual_tokens:,}. "
            f"This is exactly how many tokens would have been used "
            f"if you performed the whole process manually."
        )
        logger.info("=== Stage 1 complete — awaiting user go-ahead ===")

        return PreOptimizationResponse(
            raw_prompt_tokens=raw_tokens,
            validation=validation,
            prompt_is_clear=clarification.num_questions == 0,
            analysis=analysis,
            clarification=clarification,
            manual_projection=manual_projection,
            note=note,
        )

    # ══ Stage 2 — Optimization ═══════════════════════════════════════════════

    async def optimize(
        self,
        raw_prompt: str,
        pre_analysis: Optional[PreOptimizationResponse] = None,
    ) -> OptimizeResponse:
        """
        Runs the optimization stage. If *pre_analysis* is provided the
        stage-1 LLM calls are NOT repeated — the analysis & questions are
        reused to keep the report consistent with what the user approved.
        """
        logger.info("=== Stage 2: optimization started ===")

        # Reuse (or recompute) stage-1 data
        if pre_analysis is not None and pre_analysis.analysis is not None:
            analysis = pre_analysis.analysis
            clarification = pre_analysis.clarification or self._empty_clarification()
            manual_schema = pre_analysis.manual_projection
            validation_outcome = pre_analysis.validation
        else:
            stage1 = await self.analyze(raw_prompt)
            if not stage1.validation.is_valid:
                return OptimizeResponse(
                    raw_prompt_tokens=stage1.raw_prompt_tokens,
                    validation=stage1.validation,
                )
            analysis = stage1.analysis
            clarification = stage1.clarification or self._empty_clarification()
            manual_schema = stage1.manual_projection
            validation_outcome = stage1.validation

        raw_tokens = self._counter.count(raw_prompt)
        analysis_outcome = self._to_analysis_outcome(analysis)

        # ── Phase 5: Skill selection ──────────────────────────────────────────
        selection_outcome = await self._skill_selector.select(raw_prompt, analysis_outcome)
        skill = SkillResult(
            id=selection_outcome.skill.id,
            name=selection_outcome.skill.name,
            full_name=selection_outcome.skill.full_name,
            description=selection_outcome.skill.description,
            reason=selection_outcome.reason,
            tokens_used=selection_outcome.tokens_used,
        )
        self._log_tokens(
            "Skill Selection", input_tokens=selection_outcome.input_tokens,
            output_tokens=selection_outcome.output_tokens,
            subtotal=selection_outcome.tokens_used, formula="total = input + output",
        )
        logger.info("Stage 2 — skill: %s (tokens: %d)", skill.name, skill.tokens_used)

        # ── Phase 6: Optimization ─────────────────────────────────────────────
        opt_outcome = await self._optimizer.optimize(
            raw_prompt, selection_outcome.skill, analysis_outcome
        )
        self._log_tokens(
            "Prompt Optimization", input_tokens=opt_outcome.input_tokens,
            output_tokens=opt_outcome.output_tokens,
            subtotal=opt_outcome.llm_tokens_used, formula="total = input + output",
        )
        logger.info(
            "Stage 2 — optimized prompt tokens: %d (LLM used: %d)",
            opt_outcome.tokens, opt_outcome.llm_tokens_used,
        )

        # ── Phases 7–11: estimation, analytics, comparison, report ────────────
        return self._assemble_stage2(
            raw_tokens=raw_tokens,
            analysis_outcome=analysis_outcome,
            validation_outcome=validation_outcome,
            clarification=clarification,
            selection_outcome=selection_outcome,
            opt_outcome=opt_outcome,
            manual_schema=manual_schema,
        )

    async def stream_optimize(
        self,
        raw_prompt: str,
        pre_analysis: Optional[PreOptimizationResponse] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming variant of optimize(). Yields SSE-formatted event strings so
        the frontend can show live progress and the optimized prompt as it is
        being generated.

        Events:
          {"type":"phase","phase":...,"label":...}  — pipeline progress
          {"type":"delta","text":...}               — streamed prompt chunk
          {"type":"complete","data":{OptimizeResponse}}
          {"type":"error","message":...}            — emitted by the route
        """
        yield self._sse("phase", {"phase": "start", "label": "Starting optimization pipeline…"})

        # Reuse (or recompute) stage-1 data — identical to optimize().
        if pre_analysis is not None and pre_analysis.analysis is not None:
            analysis = pre_analysis.analysis
            clarification = pre_analysis.clarification or self._empty_clarification()
            manual_schema = pre_analysis.manual_projection
            validation_outcome = pre_analysis.validation
        else:
            stage1 = await self.analyze(raw_prompt)
            if not stage1.validation.is_valid:
                result = OptimizeResponse(
                    raw_prompt_tokens=stage1.raw_prompt_tokens,
                    validation=stage1.validation,
                )
                yield self._sse("complete", {"data": result.model_dump(mode="json")})
                return
            analysis = stage1.analysis
            clarification = stage1.clarification or self._empty_clarification()
            manual_schema = stage1.manual_projection
            validation_outcome = stage1.validation

        raw_tokens = self._counter.count(raw_prompt)
        analysis_outcome = self._to_analysis_outcome(analysis)

        # ── Phase 5: Skill selection ──────────────────────────────────────────
        yield self._sse("phase", {"phase": "skill", "label": "Selecting the best skill framework…"})
        selection_outcome = await self._skill_selector.select(raw_prompt, analysis_outcome)
        self._log_tokens(
            "Skill Selection", input_tokens=selection_outcome.input_tokens,
            output_tokens=selection_outcome.output_tokens,
            subtotal=selection_outcome.tokens_used, formula="total = input + output",
        )
        logger.info(
            "Stage 2 — skill: %s (tokens: %d)",
            selection_outcome.skill.name, selection_outcome.tokens_used,
        )

        # ── Phase 6: Optimization (STREAMED) ──────────────────────────────────
        yield self._sse("phase", {"phase": "optimize", "label": "Generating the optimized prompt…"})
        opt_outcome: Optional[OptimizationOutcome] = None
        async for kind, payload in self._optimizer.optimize_stream(
            raw_prompt, selection_outcome.skill, analysis_outcome
        ):
            if kind == "delta":
                yield self._sse("delta", {"text": payload})
            else:
                opt_outcome = payload
        if opt_outcome is None:
            raise RuntimeError("optimize_stream finished without an outcome")
        self._log_tokens(
            "Prompt Optimization", input_tokens=opt_outcome.input_tokens,
            output_tokens=opt_outcome.output_tokens,
            subtotal=opt_outcome.llm_tokens_used, formula="total = input + output",
        )

        # ── Phases 7–11: estimation, analytics, comparison, report ────────────
        yield self._sse("phase", {
            "phase": "analytics",
            "label": "Estimating execution, calculating analytics & comparison…",
        })
        result = self._assemble_stage2(
            raw_tokens=raw_tokens,
            analysis_outcome=analysis_outcome,
            validation_outcome=validation_outcome,
            clarification=clarification,
            selection_outcome=selection_outcome,
            opt_outcome=opt_outcome,
            manual_schema=manual_schema,
        )
        if result.comparison is not None:
            logger.info(
                "Stage 2 — tokens saved: %d  reduction: %.1f%%",
                result.comparison.tokens_saved,
                result.comparison.percentage_reduction,
            )
        logger.info("=== Stage 2 complete ===")

        yield self._sse("complete", {"data": result.model_dump(mode="json")})

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _sse(event_type: str, payload: dict) -> str:
        """Format a Server-Sent-Events data frame from a JSON payload."""
        return f"data: {json.dumps({'type': event_type, **payload}, default=str)}\n\n"

    def _assemble_stage2(
        self,
        *,
        raw_tokens: int,
        analysis_outcome: AnalysisOutcome,
        validation_outcome: ValidationOutcome,
        clarification: ClarificationResult,
        selection_outcome: SelectionOutcome,
        opt_outcome: OptimizationOutcome,
        manual_schema: Optional[ManualProjectionSchema],
    ) -> OptimizeResponse:
        """
        Phases 7–11: execution estimation, after-optimization analytics,
        manual projection (recomputed if missing), before-vs-after comparison
        and the final report. Shared by optimize() and stream_optimize().
        """
        skill = SkillResult(
            id=selection_outcome.skill.id,
            name=selection_outcome.skill.name,
            full_name=selection_outcome.skill.full_name,
            description=selection_outcome.skill.description,
            reason=selection_outcome.reason,
            tokens_used=selection_outcome.tokens_used,
        )
        optimized_prompt = OptimizedPromptResult(
            text=opt_outcome.text,
            tokens=opt_outcome.tokens,
            optimization_tokens_used=opt_outcome.llm_tokens_used,
        )

        # ── Phase 7: Execution estimation ─────────────────────────────────────
        # Only the final optimized prompt size + complexity label are used.
        # No optimization/analysis prompts enter this estimate (no recursion).
        exec_est = self._estimator.estimate(
            optimized_prompt.tokens, analysis_outcome.complexity
        )
        execution_estimation = ExecutionEstimationResult(
            input_tokens=exec_est.input_tokens,
            estimated_output_tokens=exec_est.estimated_output_tokens,
            total_estimated_tokens=exec_est.total_estimated_tokens,
            estimated_input_cost=exec_est.estimated_input_cost,
            estimated_output_cost=exec_est.estimated_output_cost,
            estimated_total_cost=exec_est.estimated_total_cost,
        )
        self._log_tokens(
            "Execution Estimate",
            input_tokens=exec_est.input_tokens,
            output_tokens=exec_est.estimated_output_tokens,
            subtotal=exec_est.total_estimated_tokens,
            formula="exec = optimized_prompt_tokens + output_tokens",
        )
        logger.info(
            "Stage 2 — exec estimate tokens: %d",
            execution_estimation.total_estimated_tokens,
        )

        # ── Phase 8: Optimizer analytics ──────────────────────────────────────
        # Two distinct buckets:
        #   Optimization Overhead = validation + analysis + skill + optimization
        #   Estimated Execution    = optimized prompt input + estimated output
        optimizer_analytics = self._build_optimizer_analytics(
            raw_tokens=raw_tokens,
            validation=validation_outcome,
            analysis=analysis_outcome,
            selection=selection_outcome,
            optimization=opt_outcome,
            question_generation_tokens=clarification.question_generation_tokens,
            optimized_prompt_tokens=optimized_prompt.tokens,
            estimated_execution_tokens=execution_estimation.total_estimated_tokens,
            estimated_output_tokens=execution_estimation.estimated_output_tokens,
        )
        logger.info(
            "Stage 2 — optimizer overhead: %d  execution: %d  total: %d  cost: $%.6f",
            optimizer_analytics.optimization_overhead_tokens,
            optimizer_analytics.estimated_execution_tokens,
            optimizer_analytics.total_optimizer_tokens,
            optimizer_analytics.estimated_optimizer_cost,
        )

        # ── Phase 9: Manual projection (recomputed, matches stage 1) ─────────
        if manual_schema is None:
            manual_outcome = self._manual.project(
                raw_prompt_tokens=raw_tokens,
                num_questions=clarification.num_questions,
                question_generation_tokens=clarification.question_generation_tokens,
                analysis=analysis_outcome,
            )
            manual_schema = self._to_manual_schema(manual_outcome)

        # ── Phase 10: Comparison (before − after) ─────────────────────────────
        comparison = self._build_comparison(
            optimizer_analytics, manual_schema, clarification
        )
        logger.info(
            "Stage 2 — tokens saved: %d  reduction: %.1f%%",
            comparison.tokens_saved, comparison.percentage_reduction,
        )

        # ── Phase 11: Final report ────────────────────────────────────────────
        final_report = self._reporter.generate(
            analysis=self._to_analysis_result(analysis_outcome),
            clarification=clarification,
            skill=skill,
            optimized_prompt=optimized_prompt,
            optimizer_analytics=optimizer_analytics,
            manual_projection=manual_schema,
            comparison=comparison,
        )
        logger.info("=== Stage 2 complete ===")

        return OptimizeResponse(
            raw_prompt_tokens=raw_tokens,
            validation=ValidationResult(is_valid=True, errors=[]),
            analysis=self._to_analysis_result(analysis_outcome),
            clarification=clarification,
            skill=skill,
            optimized_prompt=optimized_prompt,
            execution_estimation=execution_estimation,
            optimizer_analytics=optimizer_analytics,
            manual_projection=manual_schema,
            comparison=comparison,
            final_report=final_report,
        )

    @staticmethod
    def _to_analysis_result(outcome: AnalysisOutcome) -> AnalysisResult:
        return AnalysisResult(
            intent=outcome.intent,
            prompt_type=outcome.prompt_type,
            complexity=outcome.complexity,
            ambiguity_level=outcome.ambiguity_level,
            missing_information=outcome.missing_information,
            quality_score=outcome.quality_score,
            completeness_score=outcome.completeness_score,
            tokens_used=outcome.tokens_used,
            input_tokens=outcome.input_tokens,
            output_tokens=outcome.output_tokens,
        )

    async def _plan_and_generate_questions(
        self, raw_prompt: str, analysis_outcome: AnalysisOutcome
    ) -> ClarificationResult:
        """
        Phase 4 (two calls):
          1. Decide HOW MANY questions are required to reach the goal.
          2. Generate exactly that many questions (no answers requested).
        If the prompt is already clear, no questions are needed and the LLM
        is not called.
        """
        is_clear = (
            analysis_outcome.ambiguity_level == "low"
            and not analysis_outcome.missing_information
        )
        if is_clear:
            return self._empty_clarification()

        analysis_block = (
            f"Intent: {analysis_outcome.intent}\n"
            f"Type: {analysis_outcome.prompt_type}\n"
            f"Complexity: {analysis_outcome.complexity}\n"
            f"Ambiguity: {analysis_outcome.ambiguity_level}\n"
            f"Missing Information: {', '.join(analysis_outcome.missing_information) or 'None'}"
        )

        # ── Call A: how many questions are required ───────────────────────────
        count_messages = [
            {
                "role": "system",
                "content": (
                    "You are a prompt refinement expert. The prompt below lacks "
                    "clarity. Decide how many clarification questions a human would "
                    "need to answer before the prompt can be properly executed to "
                    "reach its desired goal. Return ONLY a single integer (e.g. 3). "
                    "Use 0 only if the prompt is actually already clear."
                ),
            },
            {
                "role": "user",
                "content": f"Prompt:\n{raw_prompt}\n\nAnalysis:\n{analysis_block}\n\nHow many clarification questions are required?",
            },
        ]
        count_tokens = 0
        try:
            count_response = await self._client.chat_completion(
                count_messages, temperature=0.0, max_tokens=512
            )
            count_tokens = count_response.total_tokens
            count_text = (count_response.content or "").strip()
            if not count_text or not any(ch.isdigit() for ch in count_text):
                raise ValueError("Empty or non-numeric question-count response")
            num_questions = max(0, extract_int(count_text, 0))
        except Exception as exc:
            logger.warning("Question-count call failed — using heuristic: %s", exc)
            # Heuristic fallback: ambiguity adds questions, missing info each needs one
            num_questions = len(analysis_outcome.missing_information)
            if analysis_outcome.ambiguity_level == "high":
                num_questions += 2
            elif analysis_outcome.ambiguity_level == "medium":
                num_questions += 1

        if num_questions == 0:
            return self._empty_clarification(question_count_tokens=count_tokens)

        # ── Call B: generate exactly that many questions ──────────────────────
        questions_messages = [
            {
                "role": "system",
                "content": (
                    "You are a prompt refinement expert. Generate the clarification "
                    "questions that must be answered before the prompt can be "
                    f"executed properly. Return ONLY a JSON array of exactly "
                    f"{num_questions} question strings: [\"Q1\", \"Q2\", ...]. "
                    "Keep each question focused and non-redundant."
                ),
            },
            {
                "role": "user",
                "content": f"Prompt:\n{raw_prompt}\n\nAnalysis:\n{analysis_block}\n\nGenerate exactly {num_questions} clarification questions.",
            },
        ]
        try:
            questions_response = await self._client.chat_completion(
                questions_messages, temperature=0.2, max_tokens=2048
            )
            questions: List[str] = extract_json(questions_response.content)
            if not isinstance(questions, list):
                questions = []
            questions = questions[:num_questions]
            text_tokens = questions_response.total_tokens
        except Exception as exc:
            logger.warning("Question-generation call failed — returning empty: %s", exc)
            questions = []
            text_tokens = 0

        est_answer_tokens = len(questions) * AVG_ANSWER_TOKENS
        est_combined = (
            self._counter.count(raw_prompt)
            + count_tokens
            + text_tokens
            + est_answer_tokens
        )
        est_execution = max(300, est_combined * 3)

        return ClarificationResult(
            questions=questions,
            question_count_tokens=count_tokens,
            question_text_tokens=text_tokens,
            question_generation_tokens=count_tokens + text_tokens,
            num_questions=len(questions),
            estimated_answer_tokens=est_answer_tokens,
            estimated_combined_prompt_tokens=est_combined,
            estimated_execution_tokens=est_execution,
        )

    def _empty_clarification(
        self, question_count_tokens: int = 0
    ) -> ClarificationResult:
        return ClarificationResult(
            questions=[],
            question_count_tokens=question_count_tokens,
            question_text_tokens=0,
            question_generation_tokens=question_count_tokens,
            num_questions=0,
            estimated_answer_tokens=0,
            estimated_combined_prompt_tokens=0,
            estimated_execution_tokens=0,
        )

    @staticmethod
    def _to_analysis_outcome(analysis: AnalysisResult) -> AnalysisOutcome:
        """Rebuild the internal AnalysisOutcome from the response schema so
        stage-1 analysis can be reused without re-running the LLM."""
        return AnalysisOutcome(
            intent=analysis.intent,
            prompt_type=analysis.prompt_type,
            complexity=analysis.complexity,
            ambiguity_level=analysis.ambiguity_level,
            missing_information=analysis.missing_information,
            quality_score=analysis.quality_score,
            completeness_score=analysis.completeness_score,
            tokens_used=analysis.tokens_used,
            input_tokens=analysis.input_tokens,
            output_tokens=analysis.output_tokens,
        )

    @staticmethod
    def _to_manual_schema(outcome) -> ManualProjectionSchema:
        return ManualProjectionSchema(
            raw_prompt_tokens=outcome.raw_prompt_tokens,
            decision_making_tokens=outcome.decision_making_tokens,
            question_generation_tokens=outcome.question_generation_tokens,
            estimated_answer_tokens=outcome.estimated_answer_tokens,
            estimated_execution_tokens=outcome.estimated_execution_tokens,
            estimated_answer_analysis_tokens=outcome.estimated_answer_analysis_tokens,
            answer_tokens_by_question=list(outcome.answer_tokens_by_question or []),
            total_estimated_manual_tokens=outcome.total_estimated_manual_tokens,
            estimated_manual_input_cost=outcome.estimated_manual_input_cost,
            estimated_manual_output_cost=outcome.estimated_manual_output_cost,
            estimated_manual_cost=outcome.estimated_manual_cost,
        )

    def _build_optimizer_analytics(
        self,
        *,
        raw_tokens: int,
        validation: ValidationOutcome,
        analysis: AnalysisOutcome,
        selection: SelectionOutcome,
        optimization: OptimizationOutcome,
        question_generation_tokens: int,
        optimized_prompt_tokens: int,
        estimated_execution_tokens: int,
        estimated_output_tokens: int,
    ) -> OptimizerAnalytics:
        """Aggregate token counts into two SEPARATE buckets:

        Optimization Overhead = Validation + Prompt Analysis + Skill Selection
                                + Prompt Optimization   (internal processing)
        Estimated Execution   = Optimized Prompt Input + Estimated Output
                                (what the target model consumes)

        Total Optimizer Tokens = Overhead + Execution.

        NOTE: raw prompt tokens are NOT added to the total — the raw prompt is
        already inside every overhead call's input, so adding it again would
        double count it. It is reported separately for display only.
        """
        validation_tokens = validation.tokens_used
        analysis_tokens = analysis.tokens_used
        skill_tokens = selection.tokens_used
        optimization_tokens = optimization.llm_tokens_used

        overhead = (
            validation_tokens + analysis_tokens + skill_tokens + optimization_tokens
        )
        total = overhead + estimated_execution_tokens

        # Overhead cost — exact per-call input/output from the API
        overhead_input = (
            validation.input_tokens
            + analysis.input_tokens
            + selection.input_tokens
            + optimization.input_tokens
        )
        overhead_output = (
            validation.output_tokens
            + analysis.output_tokens
            + selection.output_tokens
            + optimization.output_tokens
        )
        overhead_input_cost = self._calc.input_cost(overhead_input)
        overhead_output_cost = self._calc.output_cost(overhead_output)

        # Execution cost — target model consuming the final optimized prompt
        exec_input_cost = self._calc.input_cost(optimized_prompt_tokens)
        exec_output_cost = self._calc.output_cost(estimated_output_tokens)

        total_input_cost = round(overhead_input_cost + exec_input_cost, 8)
        total_output_cost = round(overhead_output_cost + exec_output_cost, 8)
        total_cost = round(total_input_cost + total_output_cost, 8)

        self._log_tokens(
            "Optimization Overhead",
            input_tokens=overhead_input,
            output_tokens=overhead_output,
            subtotal=overhead,
            formula="validation + analysis + skill + optimization",
        )

        return OptimizerAnalytics(
            raw_prompt_tokens=raw_tokens,
            validation_tokens=validation_tokens,
            decision_making_tokens=analysis_tokens,
            question_generation_tokens=question_generation_tokens,
            skill_selection_tokens=skill_tokens,
            optimization_tokens=optimization_tokens,
            optimized_prompt_tokens=optimized_prompt_tokens,
            optimization_overhead_tokens=overhead,
            estimated_execution_tokens=estimated_execution_tokens,
            total_optimizer_tokens=total,
            estimated_optimizer_input_cost=total_input_cost,
            estimated_optimizer_output_cost=total_output_cost,
            estimated_optimizer_cost=total_cost,
            estimated_execution_input_cost=round(exec_input_cost, 8),
            estimated_execution_output_cost=round(exec_output_cost, 8),
            estimated_execution_cost=round(exec_input_cost + exec_output_cost, 8),
        )

    def _build_comparison(
        self,
        analytics: OptimizerAnalytics,
        manual: ManualProjectionSchema,
        clarification: ClarificationResult,
    ) -> ComparisonResult:
        """Compare the manual workflow total with the optimizer TOTAL.

        Estimated Manual Tokens   = raw prompt + questions + user answers
                                    + execution (manual workflow)
        Estimated Optimizer Tokens = optimization overhead + estimated
                                    execution (the full pipeline, including
                                    internal processing)

        Token Savings = Manual Total − Optimizer Total.
        """
        manual_tokens = manual.total_estimated_manual_tokens
        optimizer_tokens = analytics.total_optimizer_tokens
        optimizer_cost = analytics.estimated_optimizer_cost
        tokens_saved = manual_tokens - optimizer_tokens
        pct_reduction = (
            round((tokens_saved / manual_tokens) * 100, 2) if manual_tokens > 0 else 0.0
        )
        cost_saved = round(manual.estimated_manual_cost - optimizer_cost, 8)

        return ComparisonResult(
            manual_tokens=manual_tokens,
            optimizer_tokens=optimizer_tokens,
            tokens_saved=tokens_saved,
            percentage_reduction=pct_reduction,
            estimated_cost_saved=cost_saved,
            estimated_questions_required=clarification.num_questions,
            manual_cost=manual.estimated_manual_cost,
            optimizer_cost=optimizer_cost,
            optimization_overhead_tokens=analytics.optimization_overhead_tokens,
            optimizer_total_tokens=optimizer_tokens,
        )
