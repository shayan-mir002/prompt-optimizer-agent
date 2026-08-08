"""
app/services/execution_estimator.py
Phase 7 — Estimates tokens and cost that a target AI model would consume
when actually executing the optimized prompt.

This is a PURE estimate of a SEPARATE downstream call. It receives ONLY the
final optimized prompt's token count plus the detected complexity label. It
never receives optimization instructions, framework JSON, analyzer prompts,
execution prompts, or any previous analysis output (requirement: no recursive
estimation).

Formula:
    Estimated Execution Tokens = Estimated Input Tokens + Estimated Output Tokens
        Estimated Input Tokens  = token count of the final optimized prompt
        Estimated Output Tokens = input * complexity multiplier (min 100)

No LLM call is made here.
"""
from __future__ import annotations
from dataclasses import dataclass

from app.services.cost_calculator import CostCalculator
from app.core.logging import get_logger

logger = get_logger(__name__)

# Estimated output token multipliers per complexity level
_OUTPUT_MULTIPLIERS = {
    "simple": 3.0,
    "moderate": 6.0,
    "complex": 10.0,
}


@dataclass
class ExecutionEstimate:
    input_tokens: int
    estimated_output_tokens: int
    total_estimated_tokens: int
    estimated_input_cost: float
    estimated_output_cost: float
    estimated_total_cost: float


class ExecutionEstimator:
    """
    Estimates how many tokens a downstream AI model would use
    to execute the optimized prompt. Takes only:
        - optimized_prompt_tokens  (input side)
        - complexity               (a plain label, not an analysis object)
    """

    def __init__(self, cost_calculator: CostCalculator) -> None:
        self._calc = cost_calculator

    def estimate(
        self,
        optimized_prompt_tokens: int,
        complexity: str,
    ) -> ExecutionEstimate:
        multiplier = _OUTPUT_MULTIPLIERS.get(complexity, 6.0)
        estimated_output = max(100, int(optimized_prompt_tokens * multiplier))
        total = optimized_prompt_tokens + estimated_output

        input_cost = self._calc.input_cost(optimized_prompt_tokens)
        output_cost = self._calc.output_cost(estimated_output)
        total_cost = round(input_cost + output_cost, 8)

        logger.debug(
            "Execution estimate: complexity=%s  input=%d  output=%d  total=%d  cost=$%.6f",
            complexity, optimized_prompt_tokens, estimated_output, total, total_cost,
        )

        return ExecutionEstimate(
            input_tokens=optimized_prompt_tokens,
            estimated_output_tokens=estimated_output,
            total_estimated_tokens=total,
            estimated_input_cost=input_cost,
            estimated_output_cost=output_cost,
            estimated_total_cost=total_cost,
        )
