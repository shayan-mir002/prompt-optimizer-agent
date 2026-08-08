"""
app/services/prompt_optimizer.py
Phase 6 — Generates the optimized prompt using the selected skill/framework.

The optimized prompt is returned as a clean, structured plain-text string —
NOT as JSON. The text follows the template of the selected skill.
"""
from __future__ import annotations
import re
from dataclasses import dataclass
from typing import AsyncGenerator, List, Tuple

from app.services.bluesmind_client import BluesmindClient
from app.services.skill_manager import SkillModel
from app.services.prompt_analyzer import AnalysisOutcome
from app.services.token_counter import TokenCounter
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class OptimizationOutcome:
    text: str           # the optimized prompt — plain structured text
    tokens: int         # token count of the optimized prompt text itself
    llm_tokens_used: int   # tokens consumed by this LLM call
    input_tokens: int = 0  # input tokens consumed by this LLM call
    output_tokens: int = 0 # output tokens consumed by this LLM call


class PromptOptimizer:
    """
    Transforms the raw prompt into a polished, framework-structured prompt.
    Output is plain text suitable for direct use with an AI model.
    """

    def __init__(self, client: BluesmindClient, token_counter: TokenCounter) -> None:
        self._client = client
        self._counter = token_counter

    async def optimize(
        self,
        raw_prompt: str,
        skill: SkillModel,
        analysis: AnalysisOutcome,
    ) -> OptimizationOutcome:
        system_msg, user_msg = self._build_messages(raw_prompt, skill, analysis)

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ]

        try:
            response = await self._client.chat_completion(
                messages, temperature=0.4, max_tokens=2048
            )
            optimized_text = response.content.strip()
            llm_tokens_used = response.total_tokens
            llm_input = response.prompt_tokens
            llm_output = response.completion_tokens
        except Exception as exc:
            # API is unavailable/flaky — fall back to a structured template
            # built from the selected skill so the pipeline always completes.
            logger.warning("Optimization LLM call failed — using template fallback: %s", exc)
            optimized_text = self._template_fallback(raw_prompt, skill, analysis)
            llm_tokens_used = 0
            llm_input = 0
            llm_output = 0

        optimized_tokens = self._counter.count(optimized_text)

        return OptimizationOutcome(
            text=optimized_text,
            tokens=optimized_tokens,
            llm_tokens_used=llm_tokens_used,
            input_tokens=llm_input,
            output_tokens=llm_output,
        )

    async def optimize_stream(
        self,
        raw_prompt: str,
        skill: SkillModel,
        analysis: AnalysisOutcome,
    ) -> AsyncGenerator[Tuple[str, OptimizationOutcome], None]:
        """
        Streaming variant of optimize(). Yields ("delta", text) tuples as the
        LLM generates the optimized prompt, then finally ("outcome",
        OptimizationOutcome) with the fully assembled result.

        Falls back to the template-based fallback if the LLM call fails, and
        estimates token usage with tiktoken if the stream omits usage metadata.
        """
        system_msg, user_msg = self._build_messages(raw_prompt, skill, analysis)
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ]

        parts: List[str] = []
        used_llm = False
        got_usage = False
        llm_tokens_used = 0
        llm_input = 0
        llm_output = 0
        try:
            async for delta, usage in self._client.stream_chat_completion(
                messages, temperature=0.4, max_tokens=2048
            ):
                if delta:
                    used_llm = True
                    parts.append(delta)
                    yield "delta", delta
                if usage is not None:
                    got_usage = True
                    llm_tokens_used = usage.total_tokens
                    llm_input = usage.prompt_tokens
                    llm_output = usage.completion_tokens
        except Exception as exc:
            logger.warning("Optimization stream failed — using template fallback: %s", exc)
            fallback = self._template_fallback(raw_prompt, skill, analysis)
            parts = [fallback]
            yield "delta", fallback

        optimized_text = "".join(parts).strip()

        # No usage metadata in the stream — estimate with tiktoken so the
        # analytics stay accurate for real LLM calls (but 0 for fallbacks).
        if used_llm and not got_usage:
            llm_input = self._counter.count(system_msg + "\n" + user_msg)
            llm_output = self._counter.count(optimized_text)
            llm_tokens_used = llm_input + llm_output

        optimized_tokens = self._counter.count(optimized_text)
        yield "outcome", OptimizationOutcome(
            text=optimized_text,
            tokens=optimized_tokens,
            llm_tokens_used=llm_tokens_used,
            input_tokens=llm_input,
            output_tokens=llm_output,
        )

    @staticmethod
    def _build_messages(
        raw_prompt: str,
        skill: SkillModel,
        analysis: AnalysisOutcome,
    ) -> Tuple[str, str]:
        system_msg = f"""You are a master prompt engineer specializing in the {skill.name} ({skill.full_name}) framework.

Your task: Transform the raw prompt into a highly optimized prompt using the {skill.name} framework structure.

Framework template:
{skill.template}

CRITICAL RULES:
1. Output ONLY the optimized prompt text — no preamble, no JSON, no markdown headers like ```
2. Preserve the user's original intent and every requirement completely
3. Follow the {skill.name} framework template structure
4. Fill every template variable with specific, actionable content
5. BE CONCISE: the optimized prompt must be only as long as necessary.
   Never pad, never add filler, never add explanations about the framework,
   never add meta commentary. Remove all ambiguity and vagueness.
6. The output should be ready to paste directly into an AI chat interface"""

        user_msg = (
            f"Raw prompt to optimize:\n{raw_prompt}\n\n"
            f"Analysis context:\n"
            f"- Intent: {analysis.intent}\n"
            f"- Type: {analysis.prompt_type}\n"
            f"- Complexity: {analysis.complexity}\n"
            f"- Missing: {', '.join(analysis.missing_information) or 'Nothing major'}\n\n"
            f"Apply the {skill.name} framework and return ONLY the optimized prompt text."
        )

        return system_msg, user_msg

    def _template_fallback(
        self,
        raw_prompt: str,
        skill: SkillModel,
        analysis: AnalysisOutcome,
    ) -> str:
        """Build a usable optimized prompt from the skill template without an
        LLM call, filling template variables from the analysis context."""
        context = {
            "context": (
                f"{analysis.intent} — original request: {raw_prompt}"
            ),
            "background": (
                f"{analysis.intent} — original request: {raw_prompt}"
            ),
            "objective": raw_prompt,
            "role": "Expert assistant",
            "action": raw_prompt,
            "constraints": (
                f"Follow the {skill.name} framework. Address missing details: "
                f"{', '.join(analysis.missing_information) or 'None identified'}. "
                "Keep the output precise and actionable."
            ),
            "requirements": (
                f"Follow the {skill.name} framework. Address missing details: "
                f"{', '.join(analysis.missing_information) or 'None identified'}. "
                "Keep the output precise and actionable."
            ),
            "format_and_audience": (
                f"{analysis.prompt_type} output. Structured per the {skill.name} "
                f"({skill.full_name}) framework; clear and ready to use."
            ),
            "format": (
                f"{analysis.prompt_type} output. Structured per the {skill.name} "
                f"framework; clear and ready to use."
            ),
            "audience": "Target audience and tone derived from the original request.",
            "example": f"Example usage: {raw_prompt}",
            "steps": "1) Restate the objective. 2) Provide the required output. 3) Verify against the constraints.",
            "evaluate": "Check the output against the original request before finalizing.",
        }

        text = skill.template
        for var in skill.variables:
            name = str(var.get("name", "")).lower().strip()
            content = context.get(
                name,
                f"{name.replace('_', ' ').title()}: {raw_prompt}",
            )
            text = text.replace("{{" + name + "}}", content)

        # Fill any remaining placeholders generically
        text = re.sub(
            r"\{\{\s*(\w+)\s*\}\}",
            lambda m: context.get(
                m.group(1).lower(),
                f"{m.group(1).replace('_', ' ').title()}: {raw_prompt}",
            ),
            text,
        )

        if raw_prompt.lower() not in text.lower():
            text += f"\n\nPrimary Task: {raw_prompt}"

        return text.strip()
