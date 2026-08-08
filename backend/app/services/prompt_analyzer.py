"""
app/services/prompt_analyzer.py
Phase 3 — Deep analysis of a validated prompt via LLM.

Returns: intent, prompt_type, complexity, ambiguity_level,
         missing_information, quality_score, completeness_score,
         and the tokens consumed by this call.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List

from app.services.bluesmind_client import BluesmindClient
from app.core.logging import get_logger
from app.utils.helpers import extract_json, safe_float, safe_int

logger = get_logger(__name__)


@dataclass
class AnalysisOutcome:
    intent: str
    prompt_type: str
    complexity: str
    ambiguity_level: str
    missing_information: List[str] = field(default_factory=list)
    quality_score: float = 0.0
    completeness_score: float = 0.0
    tokens_used: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


class PromptAnalyzer:
    """Calls the LLM to produce a structured analysis of the raw prompt."""

    SYSTEM_PROMPT = """You are an expert prompt analyst. Analyze the given prompt deeply and return ONLY a JSON object with these exact fields:

{
  "intent": "A clear one-sentence description of what the user is trying to accomplish",
  "prompt_type": "one of: coding | writing | analysis | creative | planning | research | marketing | data | design | other",
  "complexity": "one of: simple | moderate | complex",
  "ambiguity_level": "one of: low | medium | high",
  "missing_information": ["List of specific information pieces that are missing or unclear"],
  "quality_score": 7.5,
  "completeness_score": 68.0
}

Scoring:
- quality_score: 0–10 (how well-written and clear the prompt is)
- completeness_score: 0–100 (what % of required information is present)
- missing_information: be specific — list concrete things that are absent

Return ONLY valid JSON, no markdown, no explanation."""

    def __init__(self, client: BluesmindClient) -> None:
        self._client = client

    async def analyze(self, prompt: str) -> AnalysisOutcome:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this prompt:\n\n{prompt}"},
        ]

        try:
            response = await self._client.chat_completion(
                messages, temperature=0.2, max_tokens=1024
            )
            tokens_used = response.total_tokens
            input_tokens = response.prompt_tokens
            output_tokens = response.completion_tokens
            try:
                data = extract_json(response.content)
            except ValueError as exc:
                logger.error("Failed to parse analysis JSON: %s", exc)
                data = {}
        except Exception as exc:
            # API unavailable/flaky — degrade to a safe default so the rest of
            # the pipeline (clarification, projection, optimization) still runs.
            logger.warning("Analysis LLM call failed — using defaults: %s", exc)
            data = {}
            tokens_used = 0
            input_tokens = 0
            output_tokens = 0

        return AnalysisOutcome(
            intent=data.get("intent", "Unable to determine intent"),
            prompt_type=data.get("prompt_type", "other"),
            complexity=data.get("complexity", "moderate"),
            ambiguity_level=data.get("ambiguity_level", "medium"),
            missing_information=data.get("missing_information", []),
            quality_score=safe_float(data.get("quality_score", 5.0)),
            completeness_score=safe_float(data.get("completeness_score", 50.0)),
            tokens_used=tokens_used,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )
