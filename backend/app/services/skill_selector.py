"""
app/services/skill_selector.py
Phase 5 — Selects the most appropriate prompt engineering framework
using an LLM call that is aware of all loaded skills.
"""
from __future__ import annotations
from dataclasses import dataclass

from app.services.bluesmind_client import BluesmindClient
from app.services.skill_manager import SkillManager, SkillModel
from app.services.prompt_analyzer import AnalysisOutcome
from app.core.logging import get_logger
from app.utils.helpers import extract_json

logger = get_logger(__name__)


@dataclass
class SelectionOutcome:
    skill: SkillModel
    reason: str
    tokens_used: int
    input_tokens: int = 0
    output_tokens: int = 0


class SkillSelector:
    """
    Uses the LLM to choose the optimal skill given the prompt analysis.
    Falls back to 'no-framework' if parsing fails.
    """

    def __init__(self, client: BluesmindClient, skill_manager: SkillManager) -> None:
        self._client = client
        self._manager = skill_manager

    async def select(
        self, raw_prompt: str, analysis: AnalysisOutcome
    ) -> SelectionOutcome:
        # Compact, low-token list of available frameworks (id + name + hint),
        # NOT the full templates/descriptions of every skill.
        skills_block = self._manager.compact_list_for_llm()

        system_msg = (
            "You are a prompt engineering expert. "
            "Given the prompt analysis below, select the single best framework "
            "from the list. Return ONLY a JSON object:\n"
            '{"skill_id": "<id>", "reason": "<one concise sentence explaining the selection>"}\n\n'
            "Available frameworks:\n\n" + skills_block
        )

        analysis_summary = (
            f"Intent: {analysis.intent}\n"
            f"Prompt Type: {analysis.prompt_type}\n"
            f"Complexity: {analysis.complexity}\n"
            f"Ambiguity: {analysis.ambiguity_level}\n"
            f"Missing Information: {', '.join(analysis.missing_information) or 'None'}\n"
            f"Quality Score: {analysis.quality_score}/10\n"
            f"Completeness: {analysis.completeness_score}%"
        )

        messages = [
            {"role": "system", "content": system_msg},
            {
                "role": "user",
                "content": (
                    f"Raw prompt:\n{raw_prompt}\n\n"
                    f"Analysis:\n{analysis_summary}\n\n"
                    "Select the best framework."
                ),
            },
        ]

        try:
            response = await self._client.chat_completion(
                messages, temperature=0.1, max_tokens=512
            )
        except Exception as exc:
            logger.warning("Skill-selection LLM call failed — using heuristic: %s", exc)
            return SelectionOutcome(
                skill=self._heuristic_skill(analysis),
                reason=(
                    f"Automatically chosen because the AI service was unavailable: "
                    f"{analysis.prompt_type} / {analysis.complexity} request."
                ),
                tokens_used=0,
            )

        fallback_id = "no-framework"
        try:
            data = extract_json(response.content)
            skill_id = data.get("skill_id", fallback_id)
            reason = data.get("reason", "Best general-purpose framework.")
            skill = self._manager.get_by_id(skill_id)
            if skill is None:
                logger.warning("LLM returned unknown skill_id '%s' — using fallback", skill_id)
                skill = self._manager.get_by_id(fallback_id) or self._manager.get_all()[0]
        except Exception as exc:
            logger.error("Skill selection parse error: %s — using fallback", exc)
            skill = self._manager.get_by_id(fallback_id) or self._manager.get_all()[0]
            reason = "Fallback selection due to parsing error."

        return SelectionOutcome(
            skill=skill,
            reason=reason,
            tokens_used=response.total_tokens,
            input_tokens=response.prompt_tokens,
            output_tokens=response.completion_tokens,
        )

    def _heuristic_skill(self, analysis: AnalysisOutcome) -> SkillModel:
        """Pick a skill deterministically when the LLM is unavailable."""
        mapping = {
            "writing": "clear",
            "coding": "co-star",
            "planning": "trace",
            "analysis": "ape",
            "marketing": "aida",
        }
        skill_id = mapping.get(analysis.prompt_type, "clear")
        skill = self._manager.get_by_id(skill_id)
        if skill is None:
            skill = self._manager.get_by_id("no-framework") or self._manager.get_all()[0]
        return skill
