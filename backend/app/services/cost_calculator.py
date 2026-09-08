"""
app/services/cost_calculator.py
Token-to-cost conversion using openai/gpt-oss-120b pricing.

Pricing (per 1 000 tokens):
  Input         $0.00015   ($0.15  / 1 M)
  Cached Input  $0.00015   ($0.15  / 1 M, conservative)
  Output        $0.00060   ($0.60  / 1 M)
"""
from app.core.config import Settings


class CostCalculator:
    """Converts token counts into USD costs using configured pricing."""

    def __init__(self, settings: Settings) -> None:
        self._input_rate = settings.INPUT_COST_PER_1K       # per 1 K tokens
        self._output_rate = settings.OUTPUT_COST_PER_1K
        self._cached_rate = settings.CACHED_INPUT_COST_PER_1K

    # ── Public API ────────────────────────────────────────────────────────────

    def input_cost(self, tokens: int, cached: bool = False) -> float:
        """Cost for *tokens* input tokens."""
        rate = self._cached_rate if cached else self._input_rate
        return round((tokens / 1_000) * rate, 8)

    def output_cost(self, tokens: int) -> float:
        """Cost for *tokens* output tokens."""
        return round((tokens / 1_000) * self._output_rate, 8)

    def total_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        cached_input: bool = False,
    ) -> float:
        """Combined input + output cost."""
        return round(
            self.input_cost(input_tokens, cached=cached_input)
            + self.output_cost(output_tokens),
            8,
        )

    def format_cost(self, cost: float) -> str:
        """Return a human-readable cost string (e.g. '$0.003450')."""
        return f"${cost:.6f}"
