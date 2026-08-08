"""
app/services/manual_projection.py
Simulates the token cost of a traditional manual workflow (BEFORE optimization).
Includes prompt tokens, decision making, question generation, answer tokens,
answer analysis, and execution tokens.

Computed entirely from stage-1 data so it can be shown to the user before the
optimizer runs.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional

from app.services.cost_calculator import CostCalculator
from app.services.prompt_analyzer import AnalysisOutcome
from app.services.manual_simulator import ManualSimulationOutcome
from app.core.logging import get_logger

logger = get_logger(__name__)

# Average estimated answer length per question (tokens)
AVG_ANSWER_TOKENS_PER_QUESTION = 75

# Manual execution is less efficient: manual prompts consume more output tokens.
MANUAL_EXECUTION_MULTIPLIER = 1.8

# Manual execution output multiplier per complexity level
_EXECUTION_MULTIPLIERS = {
    "simple": 3.0,
    "moderate": 6.0,
    "complex": 10.0,
}


@dataclass
class ManualProjectionOutcome:
    raw_prompt_tokens: int
    decision_making_tokens: int
    question_generation_tokens: int
    estimated_answer_tokens: int
    estimated_execution_tokens: int
    estimated_answer_analysis_tokens: int
    answer_tokens_by_question: List[int] = field(default_factory=list)
    total_estimated_manual_tokens: int = 0
    estimated_manual_input_cost: float = 0.0
    estimated_manual_output_cost: float = 0.0
    estimated_manual_cost: float = 0.0


class ManualProjection:
    """
    Projects what the manual workflow would have cost in tokens and dollars.
    Uses clarification question data generated in the analysis stage.
    """

    def __init__(self, cost_calculator: CostCalculator) -> None:
        self._calc = cost_calculator

    def project(
        self,
        raw_prompt_tokens: int,
        num_questions: int,
        question_generation_tokens: int,
        analysis: AnalysisOutcome,
        sim: Optional[ManualSimulationOutcome] = None,
    ) -> ManualProjectionOutcome:

        # 1) Raw prompt tokens
        # 2) Decision making tokens (analysis) — OPTIMIZER OVERHEAD. Per spec the
        #    manual workflow excludes optimizer overhead, so this is recorded but
        #    NOT included in the manual total or cost.
        decision_making_tokens = analysis.tokens_used

        # 3) Tokens to generate the questions
        # (passed in — already includes planning + generation LLM tokens)

        # 4) Estimated answer tokens (simulated user answers, REAL LLM output
        #    when the simulator ran, otherwise num_questions * average length)
        if sim is not None and sim.answer_tokens is not None:
            estimated_answer_tokens = sim.answer_tokens
        else:
            estimated_answer_tokens = num_questions * AVG_ANSWER_TOKENS_PER_QUESTION

        # 5) Number of tokens to execute the answers
        # (The manual run: raw prompt + answers executed against the LLM.
        #  Prefer the REAL measured tokens; fall back to a formula otherwise.
        #  Never allowed to drop below the question-generation tokens.)
        if sim is not None and sim.execution_tokens is not None:
            execution_base = sim.execution_tokens
        else:
            multiplier = _EXECUTION_MULTIPLIERS.get(analysis.complexity, 6.0)
            execution_base = max(
                200,
                int((raw_prompt_tokens + estimated_answer_tokens) * multiplier),
            )
        estimated_execution_tokens = max(
            300,
            question_generation_tokens,
            execution_base,
        )

        # 6) Number of tokens to analyze the user answers (simulated)
        # (REAL LLM measurement when available, otherwise a reading estimate)
        # Recorded for transparency but NOT counted in the manual total — it is
        # optimizer-style overhead, not part of the manual execution forecast.
        if sim is not None and sim.answer_analysis_tokens is not None:
            estimated_answer_analysis_tokens = sim.answer_analysis_tokens
        else:
            estimated_answer_analysis_tokens = int(
                (raw_prompt_tokens + estimated_answer_tokens) * 1.2
            )

        # Manual workflow total = Raw Prompt + Question Generation + User
        # Answers + Execution. Only these four components (per spec).
        total = (
            raw_prompt_tokens
            + question_generation_tokens
            + estimated_answer_tokens
            + estimated_execution_tokens
        )

        # Cost calculation (manual execution only)
        # Inputs: raw prompt + the user's answers
        input_tokens = raw_prompt_tokens + estimated_answer_tokens
        # Outputs: generated questions + final execution output
        output_tokens = question_generation_tokens + estimated_execution_tokens

        input_cost = self._calc.input_cost(input_tokens)
        output_cost = self._calc.output_cost(output_tokens)
        total_cost = round(input_cost + output_cost, 8)

        logger.debug(
            "Manual projection: raw=%d decision=%d questions_gen=%d answers=%d exec=%d analysis=%d total=%d cost=$%.6f",
            raw_prompt_tokens, decision_making_tokens, question_generation_tokens,
            estimated_answer_tokens, estimated_execution_tokens,
            estimated_answer_analysis_tokens, total, total_cost,
        )

        return ManualProjectionOutcome(
            raw_prompt_tokens=raw_prompt_tokens,
            decision_making_tokens=decision_making_tokens,
            question_generation_tokens=question_generation_tokens,
            estimated_answer_tokens=estimated_answer_tokens,
            estimated_execution_tokens=estimated_execution_tokens,
            estimated_answer_analysis_tokens=estimated_answer_analysis_tokens,
            answer_tokens_by_question=(
                list(sim.answer_tokens_by_question)
                if sim is not None else []
            ),
            total_estimated_manual_tokens=total,
            estimated_manual_input_cost=input_cost,
            estimated_manual_output_cost=output_cost,
            estimated_manual_cost=total_cost,
        )
