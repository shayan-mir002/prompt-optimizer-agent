// src/types/optimizer.ts
// TypeScript interfaces mirroring the backend Pydantic schemas

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  tokens_used: number;
  input_tokens: number;
  output_tokens: number;
}

export interface AnalysisResult {
  intent: string;
  prompt_type: string;
  complexity: 'simple' | 'moderate' | 'complex';
  ambiguity_level: 'low' | 'medium' | 'high';
  missing_information: string[];
  quality_score: number;
  completeness_score: number;
  tokens_used: number;
  input_tokens: number;
  output_tokens: number;
}

export interface ClarificationResult {
  questions: string[];
  question_count_tokens: number;
  question_text_tokens: number;
  question_generation_tokens: number;
  num_questions: number;
  estimated_answer_tokens: number;
  estimated_combined_prompt_tokens: number;
  estimated_execution_tokens: number;
}

export interface SkillResult {
  id: string;
  name: string;
  full_name: string;
  description: string;
  reason: string;
  tokens_used: number;
}

export interface OptimizedPromptResult {
  text: string;
  tokens: number;
  optimization_tokens_used: number;
}

export interface ExecutionEstimationResult {
  input_tokens: number;
  estimated_output_tokens: number;
  total_estimated_tokens: number;
  estimated_input_cost: number;
  estimated_output_cost: number;
  estimated_total_cost: number;
}

export interface OptimizerAnalytics {
  raw_prompt_tokens: number;
  validation_tokens: number;
  decision_making_tokens: number;
  question_generation_tokens: number;
  skill_selection_tokens: number;
  optimization_tokens: number;
  optimized_prompt_tokens: number;
  optimization_overhead_tokens: number;
  estimated_execution_tokens: number;
  total_optimizer_tokens: number;
  estimated_optimizer_input_cost: number;
  estimated_optimizer_output_cost: number;
  estimated_optimizer_cost: number;
  estimated_execution_input_cost: number;
  estimated_execution_output_cost: number;
  estimated_execution_cost: number;
}

export interface ManualProjection {
  raw_prompt_tokens: number;
  decision_making_tokens: number;
  question_generation_tokens: number;
  estimated_answer_tokens: number;
  estimated_execution_tokens: number;
  estimated_answer_analysis_tokens: number;
  answer_tokens_by_question: number[];
  total_estimated_manual_tokens: number;
  estimated_manual_input_cost: number;
  estimated_manual_output_cost: number;
  estimated_manual_cost: number;
}

export interface ComparisonResult {
  manual_tokens: number;
  optimizer_tokens: number;
  tokens_saved: number;
  percentage_reduction: number;
  estimated_cost_saved: number;
  estimated_questions_required: number;
  manual_cost: number;
  optimizer_cost: number;
  optimization_overhead_tokens: number;
  optimizer_total_tokens: number;
}

export interface FinalReport {
  // Optimized Prompt
  optimized_prompt: string;
  // Analysis
  intent: string;
  prompt_type: string;
  complexity: string;
  completeness_score: number;
  quality_score: number;
  ambiguity_level: string;
  missing_requirements: string[];
  // Skill
  selected_skill: string;
  skill_full_name: string;
  skill_reason: string;
  // Manual Workflow
  num_questions: number;
  generated_questions: string[];
  raw_prompt_tokens: number;
  decision_making_tokens: number;
  estimated_question_tokens: number;
  estimated_answer_tokens: number;
  estimated_execution_tokens: number;
  estimated_answer_analysis_tokens: number;
  total_estimated_manual_tokens: number;
  estimated_manual_cost: number;
  // Optimizer Workflow
  raw_prompt_tokens_opt: number;
  decision_making_tokens_opt: number;
  question_generation_tokens_opt: number;
  skill_selection_tokens: number;
  optimization_tokens: number;
  optimized_prompt_tokens: number;
  estimated_optimizer_execution_tokens: number;
  optimization_overhead_tokens: number;
  total_optimizer_tokens: number;
  estimated_optimizer_cost: number;
  estimated_execution_cost: number;
  // Comparison
  manual_tokens: number;
  optimizer_tokens_total: number;
  tokens_saved: number;
  percentage_reduction: number;
  estimated_cost_saved: number;
  optimization_overhead_tokens_total: number;
  optimizer_total_tokens_total: number;
}

export interface OptimizeResponse {
  raw_prompt_tokens: number;
  validation: ValidationResult;
  analysis?: AnalysisResult;
  clarification?: ClarificationResult;
  skill?: SkillResult;
  optimized_prompt?: OptimizedPromptResult;
  execution_estimation?: ExecutionEstimationResult;
  optimizer_analytics?: OptimizerAnalytics;
  manual_projection?: ManualProjection;
  comparison?: ComparisonResult;
  final_report?: FinalReport;
}

export interface PreOptimizationResponse {
  raw_prompt_tokens: number;
  validation: ValidationResult;
  prompt_is_clear: boolean;
  analysis?: AnalysisResult;
  clarification?: ClarificationResult;
  manual_projection?: ManualProjection;
  note: string;
}

export type OptimizationStatus =
  | 'idle'
  | 'analyzing'
  | 'analyzed'
  | 'optimizing'
  | 'success'
  | 'error';
