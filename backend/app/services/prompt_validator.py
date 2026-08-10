"""
app/services/prompt_validator.py
Phase 2 — Validates whether a raw prompt is processable.

Rules applied in order:
  1. Empty / whitespace-only
  2. Too short (< 10 characters after strip)
  3. Meaningless / gibberish  (LLM-based check)
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List

from app.services.bluesmind_client import BluesmindClient
from app.core.logging import get_logger
from app.utils.helpers import extract_json

logger = get_logger(__name__)

MIN_CHARS = 10


@dataclass
class ValidationOutcome:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    tokens_used: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


class PromptValidator:
    """
    Runs rule-based checks, then a lightweight LLM check for coherence.
    Designed to be fast: only the LLM call touches the network.
    """

    def __init__(self, client: BluesmindClient) -> None:
        self._client = client

    async def validate(self, prompt: str) -> ValidationOutcome:
        errors: List[str] = []

        # Rule 1 – emptiness
        stripped = prompt.strip()
        if not stripped:
            errors.append("Prompt must not be empty.")
            return ValidationOutcome(is_valid=False, errors=errors)

        # Rule 2 – minimum length
        if len(stripped) < MIN_CHARS:
            errors.append(
                f"Prompt is too short ({len(stripped)} chars). "
                f"Please provide at least {MIN_CHARS} characters."
            )
            return ValidationOutcome(is_valid=False, errors=errors)

        # Rule 3 – LLM coherence check
        llm_tokens = 0
        llm_input = 0
        llm_output = 0
        try:
            llm_errors, llm_tokens, llm_input, llm_output = await self._llm_coherence_check(stripped)
            errors.extend(llm_errors)
        except Exception as exc:
            logger.warning("LLM coherence check failed (skipped): %s", exc)

        return ValidationOutcome(
            is_valid=len(errors) == 0,
            errors=errors,
            tokens_used=llm_tokens,
            input_tokens=llm_input,
            output_tokens=llm_output,
        )

    async def _llm_coherence_check(self, prompt: str):
        """Ask the LLM whether the prompt is meaningful and actionable.
        Returns (errors, tokens_used, input_tokens, output_tokens)."""
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a prompt quality gate. Decide whether the given text "
                    "can be optimized into a better prompt. Accept any text that "
                    "contains an actual request or instruction — asking an AI to "
                    "explain, write, code, analyze, summarize, plan, teach, etc. "
                    "— even if it is vague or incomplete.\n\n"
                    "Reject (is_valid=false) input that is NOT a usable prompt:\n"
                    '- Casual conversation or greetings (e.g. "hi", "how are you")\n'
                    "- Gibberish, random keystrokes, or meaningless text\n\n"
                    "Return ONLY a JSON object: "
                    '{"is_valid": true|false, "errors": ["error message", ...]}'
                    "\n\nErrors should only appear when is_valid is false. "
                    "Be very lenient — accept any prompt with a request or task "
                    'intent, including "explain X", "tell me about X", '
                    '"summarize X". Only reject text that has no task at all.'
                ),
            },
            {
                "role": "user",
                "content": f"Prompt to evaluate:\n\n{prompt}",
            },
        ]

        response = await self._client.chat_completion(
            messages, temperature=0.0, max_tokens=1024
        )
        if not response.content or not response.content.strip():
            logger.info("LLM returned empty validation response — treated as lenient pass")
            return [], response.total_tokens, response.prompt_tokens, response.completion_tokens
        data = extract_json(response.content)
        if not data.get("is_valid", True):
            # Always surface the exact user-facing message for non-optimizable
            # input, regardless of what the model returned.
            return (
                ["Please enter an appropriate prompt to optimize"],
                response.total_tokens,
                response.prompt_tokens,
                response.completion_tokens,
            )
        return [], response.total_tokens, response.prompt_tokens, response.completion_tokens
