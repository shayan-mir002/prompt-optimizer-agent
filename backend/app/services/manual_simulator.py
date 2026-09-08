"""
app/services/manual_simulator.py
Simulates the manual (BEFORE-optimization) workflow with REAL LLM calls so the
token numbers shown are actual measurements instead of guesses:

  1. Simulate the user's answers to the clarification questions.
  2. Analyze those answers (as a human would).
  3. Execute the raw prompt once per question, incorporating each answer in
     turn and summing every round (the manual run).

Every step records the LLM's real token usage. A failed step returns None so
the caller can fall back to its heuristic estimate for that single component.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional

from app.services.bluesmind_client import BluesmindClient
from app.services.token_counter import TokenCounter
from app.services.prompt_analyzer import AnalysisOutcome
from app.utils.helpers import extract_json
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ManualSimulationOutcome:
    """Real (LLM-measured) token usage of the manual workflow. None = step failed."""
    simulated_answers: List[str]
    answer_tokens: Optional[int]              # real tokens of the answers text
    answer_tokens_by_question: List[int]      # per-answer approx counts (tokenizer)
    answer_simulation_tokens: Optional[int]   # LLM tokens used to generate answers
    answer_analysis_tokens: Optional[int]     # LLM tokens used to analyze answers
    execution_tokens: Optional[int]           # LLM tokens used to execute the prompt
    # Input/output attribution of each LLM call (for accurate cost calculation)
    answers_input_tokens: Optional[int] = None
    answers_output_tokens: Optional[int] = None
    answer_analysis_input_tokens: Optional[int] = None
    answer_analysis_output_tokens: Optional[int] = None
    execution_input_tokens: Optional[int] = None
    execution_output_tokens: Optional[int] = None


class ManualSimulator:
    """
    Runs the manual workflow against the LLM and returns real token counts.
    The questions come from the clarification stage; the answers are simulated
    because there is no real user in a before-optimization forecast.
    """

    def __init__(self, client: BluesmindClient, token_counter: TokenCounter) -> None:
        self._client = client
        self._counter = token_counter

    async def simulate(
        self,
        raw_prompt: str,
        questions: List[str],
        analysis: AnalysisOutcome,
    ) -> ManualSimulationOutcome:
        answers: List[str] = []
        answer_tokens: Optional[int] = None
        answer_sim_tokens: Optional[int] = None
        answers_input: Optional[int] = None
        answers_output: Optional[int] = None

        # ── Step 1: simulate the user's answers ───────────────────────────────
        if questions:
            try:
                q_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are the user who submitted this prompt and then "
                            "received clarification questions. Answer each question "
                            "briefly and realistically, exactly as a real user would. "
                            'Return ONLY a JSON object: {"answers": ["...", "..."]} '
                            "with exactly as many answers as there are questions."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Prompt:\n{raw_prompt}\n\n"
                            f"Clarification questions:\n{q_text}\n\n"
                            "Answer each question."
                        ),
                    },
                ]
                response = await self._client.chat_completion(
                    messages, temperature=0.4, max_tokens=1024
                )
                data = extract_json(response.content)
                if isinstance(data, dict) and isinstance(data.get("answers"), list):
                    answers = [str(a) for a in data["answers"][: len(questions)]]
                # The model's OWN usage — the output WAS the answers, so its
                # completion_tokens are the real token cost of the answers.
                answer_tokens = response.completion_tokens if answers else 0
                answer_sim_tokens = response.total_tokens
                answers_input = response.prompt_tokens if answers else 0
                answers_output = response.completion_tokens if answers else 0
            except Exception as exc:
                logger.warning("Manual sim — answer simulation failed: %s", exc)

        # ── Step 2: analyze the user's answers ─────────────────────────────────
        analysis_tokens: Optional[int] = None
        analysis_input: Optional[int] = None
        analysis_output: Optional[int] = None
        if questions and answers:
            try:
                qa_text = "\n".join(
                    f"Q{i+1}: {q}\nA{i+1}: {a}"
                    for i, (q, a) in enumerate(zip(questions, answers))
                )
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are refining a prompt based on the user's answers. "
                            "Read the user's answers to the clarification questions "
                            "and summarize the concrete details that must be "
                            "incorporated into the prompt before it can be executed "
                            "well."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Prompt:\n{raw_prompt}\n\n"
                            f"Questions & answers:\n{qa_text}\n\n"
                            "Analyze the user's answers."
                        ),
                    },
                ]
                response = await self._client.chat_completion(
                    messages, temperature=0.2, max_tokens=1024
                )
                analysis_tokens = response.total_tokens
                analysis_input = response.prompt_tokens
                analysis_output = response.completion_tokens
            except Exception as exc:
                logger.warning("Manual sim — answer analysis failed: %s", exc)

        # ── Step 3: execute the prompt, one question at a time ──────────────
        # In the manual workflow the user answers each clarification question
        # and the task is re-run to incorporate that answer. Execution tokens
        # are therefore the SUM of all N rounds: every round re-reads the
        # prompt plus the growing question/answer transcript (input) and emits
        # an updated result (output). This is why execution grows with the
        # number of questions.
        execution_tokens: Optional[int] = None
        execution_input: Optional[int] = None
        execution_output: Optional[int] = None
        try:
            if questions and answers:
                total_exec = 0
                total_exec_input = 0
                total_exec_output = 0
                transcript: List[str] = []
                for i, (q, a) in enumerate(zip(questions, answers)):
                    transcript.append(f"Q{i+1}: {q}\nA{i+1}: {a}")
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "You are executing the user's prompt and "
                                "incorporating the user's clarifications one at "
                                "a time. After this round, produce the current "
                                "complete result of the task reflecting every "
                                "answer received so far. Keep the deliverable "
                                f"coherent and complete (round {i+1} of {len(questions)})."
                            ),
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Prompt:\n{raw_prompt}\n\n"
                                f"Questions & answers so far:\n{'\n\n'.join(transcript)}\n\n"
                                "Produce the updated result for this round."
                            ),
                        },
                    ]
                    response = await self._client.chat_completion(
                        messages, temperature=0.7, max_tokens=1024
                    )
                    total_exec += response.total_tokens
                    total_exec_input += response.prompt_tokens
                    total_exec_output += response.completion_tokens
                execution_tokens = total_exec
                execution_input = total_exec_input
                execution_output = total_exec_output
            else:
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are executing the user's prompt exactly as "
                            "written. Produce the complete, final result."
                        ),
                    },
                    {"role": "user", "content": raw_prompt},
                ]
                response = await self._client.chat_completion(
                    messages, temperature=0.7, max_tokens=2048
                )
                execution_tokens = response.total_tokens
                execution_input = response.prompt_tokens
                execution_output = response.completion_tokens
        except Exception as exc:
            logger.warning("Manual sim — execution failed: %s", exc)

        logger.info(
            "Manual simulation: answers=%d sim_tokens=%s analysis_tokens=%s exec_tokens=%s",
            len(answers),
            answer_sim_tokens,
            analysis_tokens,
            execution_tokens,
        )

        return ManualSimulationOutcome(
            simulated_answers=answers,
            answer_tokens=answer_tokens,
            answer_tokens_by_question=[self._counter.count(a) for a in answers],
            answer_simulation_tokens=answer_sim_tokens,
            answer_analysis_tokens=analysis_tokens,
            execution_tokens=execution_tokens,
            answers_input_tokens=answers_input if questions else None,
            answers_output_tokens=answers_output if questions else None,
            answer_analysis_input_tokens=analysis_input,
            answer_analysis_output_tokens=analysis_output,
            execution_input_tokens=execution_input,
            execution_output_tokens=execution_output,
        )
