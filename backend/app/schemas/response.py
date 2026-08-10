"""
app/schemas/response.py
Pydantic response models — one for every pipeline phase plus the root response.
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel


# ── Phase 2: Validation ───────────────────────────────────────────────────────

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    tokens_used: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


# ── Phase 3: Analysis ─────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    intent: str
    prompt_type: str
    complexity: str                   # simple | moderate | complex
    ambiguity_level: str              # low | medium | high
    missing_information: List[str]
    quality_score: float              # 0–10
    completeness_score: float         # 0–100
    tokens_used: int                  # actual LLM tokens consumed
    input_tokens: int = 0             # input portion of tokens_used
    output_tokens: int = 0            # output portion of tokens_used


# ── Phase 4: Clarification Simulation ────────────────────────────────────────

class ClarificationResult(BaseModel):
    questions: List[str]
    question_count_tokens: int        # LLM tokens used to plan the number of questions
    question_text_tokens: int         # LLM tokens used to write the questions
    question_generation_tokens: int   # count + text tokens (total question phase)
    num_questions: int
    estimated_answer_tokens: int      # estimated (75 tokens × num_questions)
    estimated_combined_prompt_tokens: int   # estimated
    estimated_execution_tokens: int         # estimated


# ── Phase 5: Skill ────────────────────────────────────────────────────────────

class SkillResult(BaseModel):
    id: str
    name: str
    full_name: str
    description: str
    reason: str
    tokens_used: int                  # tokens consumed to select the skill


# ── Phase 6: Optimized Prompt ─────────────────────────────────────────────────

class OptimizedPromptResult(BaseModel):
    text: str                         # plain structured text — NOT JSON
    tokens: int
    optimization_tokens_used: int     # LLM tokens consumed for this call


# ── Phase 7: Execution Estimation ────────────────────────────────────────────

class ExecutionEstimationResult(BaseModel):
    input_tokens: int
    estimated_output_tokens: int
    total_estimated_tokens: int
    estimated_input_cost: float
    estimated_output_cost: float
    estimated_total_cost: float


# ── Phase 8: Optimizer Analytics ─────────────────────────────────────────────

class OptimizerAnalytics(BaseModel):
    raw_prompt_tokens: int
    skill_selection_tokens: int
    optimization_tokens: int
    optimized_prompt_tokens: int
    estimated_execution_tokens: int
    total_optimizer_tokens: int
    estimated_optimizer_input_cost: float
    estimated_optimizer_output_cost: float
    estimated_optimizer_cost: float
    estimated_execution_input_cost: float = 0.0
    estimated_execution_output_cost: float = 0.0
    estimated_execution_cost: float = 0.0


# ── Phase 9: Manual Workflow Projection ──────────────────────────────────────

class ManualProjection(BaseModel):
    raw_prompt_tokens: int
    decision_making_tokens: int
    question_generation_tokens: int
    estimated_answer_tokens: int
    estimated_execution_tokens: int
    estimated_answer_analysis_tokens: int
    answer_tokens_by_question: List[int] = []
    total_estimated_manual_tokens: int
    estimated_manual_input_cost: float
    estimated_manual_output_cost: float
    estimated_manual_cost: float


# ── Phase 10: Comparison ──────────────────────────────────────────────────────

class ComparisonResult(BaseModel):
    manual_tokens: int
    optimizer_tokens: int
    tokens_saved: int
    percentage_reduction: float
    estimated_cost_saved: float
    estimated_questions_required: int
    manual_cost: float
    optimizer_cost: float


# ── Phase 11: Final Report ────────────────────────────────────────────────────

class FinalReport(BaseModel):
    # ── Optimized Prompt
    optimized_prompt: str

    # ── Prompt Analysis
    intent: str
    prompt_type: str
    complexity: str
    completeness_score: float
    quality_score: float
    ambiguity_level: str
    missing_requirements: List[str]

    # ── Skill
    selected_skill: str
    skill_full_name: str
    skill_reason: str

    # ── Manual Workflow
    num_questions: int
    generated_questions: List[str]
    raw_prompt_tokens: int
    decision_making_tokens: int
    estimated_question_tokens: int
    estimated_answer_tokens: int
    estimated_execution_tokens: int
    estimated_answer_analysis_tokens: int
    total_estimated_manual_tokens: int
    estimated_manual_cost: float

    # ── Optimizer Workflow
    raw_prompt_tokens_opt: int
    skill_selection_tokens: int
    optimization_tokens: int
    optimized_prompt_tokens: int
    estimated_optimizer_execution_tokens: int
    total_optimizer_tokens: int
    estimated_optimizer_cost: float
    estimated_execution_cost: float = 0.0

    # ── Comparison
    manual_tokens: int
    optimizer_tokens_total: int
    tokens_saved: int
    percentage_reduction: float
    estimated_cost_saved: float


# ── Root Response ─────────────────────────────────────────────────────────────

class OptimizeResponse(BaseModel):
    raw_prompt_tokens: int
    validation: ValidationResult
    analysis: Optional[AnalysisResult] = None
    clarification: Optional[ClarificationResult] = None
    skill: Optional[SkillResult] = None
    optimized_prompt: Optional[OptimizedPromptResult] = None
    execution_estimation: Optional[ExecutionEstimationResult] = None
    optimizer_analytics: Optional[OptimizerAnalytics] = None
    manual_projection: Optional[ManualProjection] = None
    comparison: Optional[ComparisonResult] = None
    final_report: Optional[FinalReport] = None


# ── Stage 1: Pre-Optimization (Analysis) ──────────────────────────────────────

class PreOptimizationResponse(BaseModel):
    """Result of the analysis stage — returned BEFORE any optimization runs."""

    raw_prompt_tokens: int
    validation: ValidationResult
    prompt_is_clear: bool
    analysis: Optional[AnalysisResult] = None
    clarification: Optional[ClarificationResult] = None
    manual_projection: Optional[ManualProjection] = None
    note: str = ""
