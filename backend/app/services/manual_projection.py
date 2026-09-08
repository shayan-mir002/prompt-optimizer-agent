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

# Heuristic input fraction of a call whose input/output split is unknown.
# Used ONLY when the real simulator did not run (it normally does).
_CALL_INPUT_FRACTION = 0.7

# Manual execution output size per question round (tokens), by complexity —
# each round produces an updated draft of the deliverable.
_EXECUTION_OUTPUT_PER_QUESTION = {
    "simple": 150,
    "moderate": 250,
    "complex": 350,
}

# Fixed per-round overhead (system prompt + formatting) in tokens.
_EXECUTION_ROUND_OVERHEAD = 120

# Single-run execution output multiplier per complexity level
# (used only when there were NO clarification questions).
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
        question_generation_input_tokens: int = 0,
        question_generation_output_tokens: int = 0,
    ) -> ManualProjectionOutcome:

        # 1) Raw prompt tokens
        # 2) Decision making tokens (analysis) — the AI reads the prompt and
        #    decides how to proceed. Counted in the manual workflow total.
        decision_making_tokens = analysis.tokens_used

        # 3) Tokens to generate the questions
        # (passed in — already includes planning + generation LLM tokens)

        # 4) Estimated answer tokens (simulated user answers, REAL LLM output
        #    when the simulator ran, otherwise num_questions * average length)
        if sim is not None and sim.answer_tokens is not None:
            estimated_answer_tokens = sim.answer_tokens
        else:
            estimated_answer_tokens = num_questions * AVG_ANSWER_TOKENS_PER_QUESTION

        # 5) Total tokens to execute ALL the questions.
        # In the manual workflow each clarification answer is incorporated by
        # re-running the task, so execution is the SUM over every question:
        # each round re-reads the prompt plus the accumulated Q&A (growing
        # input) and emits an updated result (output). Prefer the REAL measured
        # sum from the simulator; otherwise fall back to a closed-form estimate.
        if sim is not None and sim.execution_tokens is not None:
            estimated_execution_tokens = max(100, sim.execution_tokens)
        elif num_questions <= 0:
            multiplier = _EXECUTION_MULTIPLIERS.get(analysis.complexity, 6.0)
            estimated_execution_tokens = max(
                100, int(raw_prompt_tokens * (1.0 + multiplier))
            )
        else:
            avg_answer = (
                sim.answer_tokens // num_questions
                if sim is not None and sim.answer_tokens and num_questions > 0
                else AVG_ANSWER_TOKENS_PER_QUESTION
            )
            output_per_q = _EXECUTION_OUTPUT_PER_QUESTION.get(analysis.complexity, 250)
            # Round i reads the prompt + i answers + fixed overhead (growing input)
            cumulative_inputs = (
                num_questions * raw_prompt_tokens
                + avg_answer * num_questions * (num_questions + 1) // 2
                + num_questions * _EXECUTION_ROUND_OVERHEAD
            )
            cumulative_outputs = num_questions * output_per_q
            estimated_execution_tokens = max(
                100, cumulative_inputs + cumulative_outputs
            )

        # 6) Number of tokens to analyze the user answers (simulated)
        # (REAL LLM measurement when available, otherwise a reading estimate)
        # Counted in the manual workflow total.
        if sim is not None and sim.answer_analysis_tokens is not None:
            estimated_answer_analysis_tokens = sim.answer_analysis_tokens
        else:
            estimated_answer_analysis_tokens = int(
                (raw_prompt_tokens + estimated_answer_tokens) * 1.2
            )

        # Manual workflow total = Raw Prompt + Decision Making + Question
        # Generation + User Answers + Execution + Answer Analysis. All six
        # components are counted in the manual projection.
        total = (
            raw_prompt_tokens
            + decision_making_tokens
            + question_generation_tokens
            + estimated_answer_tokens
            + estimated_execution_tokens
            + estimated_answer_analysis_tokens
        )

        # Cost calculation — REAL LLM usage when available, otherwise the SAME
        # estimate that produced the token figure above, so the cost and the
        # token total always agree. The prompt text is NOT added as a separate
        # line item because it is already inside every call's measured tokens.
        decision_input = analysis.input_tokens
        decision_output = analysis.output_tokens

        if sim is not None and (
            sim.answers_input_tokens is not None and sim.answers_output_tokens is not None
        ):
            ans_in, ans_out = sim.answers_input_tokens, sim.answers_output_tokens
        else:
            ans_in, ans_out = 0, estimated_answer_tokens

        if sim is not None and (
            sim.execution_input_tokens is not None
            and sim.execution_output_tokens is not None
        ):
            exec_in, exec_out = sim.execution_input_tokens, sim.execution_output_tokens
        else:
            exec_in = int(estimated_execution_tokens * _CALL_INPUT_FRACTION)
            exec_out = estimated_execution_tokens - exec_in

        if sim is not None and (
            sim.answer_analysis_input_tokens is not None
            and sim.answer_analysis_output_tokens is not None
        ):
            anl_in, anl_out = (
                sim.answer_analysis_input_tokens,
                sim.answer_analysis_output_tokens,
            )
        else:
            anl_in = int(estimated_answer_analysis_tokens * _CALL_INPUT_FRACTION)
            anl_out = estimated_answer_analysis_tokens - anl_in

        if (question_generation_input_tokens or question_generation_output_tokens) > 0:
            qg_in = max(0, question_generation_input_tokens)
            qg_out = max(0, question_generation_output_tokens)
        else:
            qg_in = int(question_generation_tokens * _CALL_INPUT_FRACTION)
            qg_out = question_generation_tokens - qg_in

        input_tokens = decision_input + qg_in + ans_in + exec_in + anl_in
        output_tokens = decision_output + qg_out + ans_out + exec_out + anl_out

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
