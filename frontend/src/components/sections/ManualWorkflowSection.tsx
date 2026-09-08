// src/components/sections/ManualWorkflowSection.tsx
import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import type { ManualProjection, ClarificationResult } from '../../types/optimizer';
import { SectionHeading } from '../ui/SectionHeading';
import { fmt, fmtMoney } from '../../utils/format';

interface ManualWorkflowSectionProps {
  manual: ManualProjection;
  clarification: ClarificationResult;
  beforeOptimization?: boolean;
}

export const ManualWorkflowSection: React.FC<ManualWorkflowSectionProps> = ({
  manual, clarification, beforeOptimization = true,
}) => (
  <section id="manual-workflow" className="section-card animate-slide-up">
    <SectionHeading
      icon={Users}
      title={beforeOptimization ? 'Before Optimization — Manual Workflow Projection' : 'Manual Workflow Projection'}
      subtitle={beforeOptimization
        ? 'Step 1 — Total tokens & cost if you refined this prompt manually'
        : 'Phase 9 — Simulated traditional Q&A workflow'}
    />

    <div className="surface-subtle p-3 flex items-start gap-2 mb-4 border-[#E0A93B]/20">
      <AlertCircle size={13} className="text-[#E0A93B] flex-shrink-0 mt-0.5" />
      <p className="text-xs text-[#E8C079] leading-relaxed">
        This workflow is <strong>simulated</strong>: the AI plays the user's answers, then runs the
        task <strong>once per question</strong>, incorporating each answer and producing an updated
        result (that's row&nbsp;5). Every token figure is the model's <strong>real measured usage</strong>,
        returned by the API itself. Row 5 sums every question round — each round re-reads the prompt
        and the growing Q&A, so it scales with the number of questions.
      </p>
    </div>

    <div className="mb-4">
      <div className="kv-row">
        <span className="kv-label">1) Estimated tokens for prompt text</span>
        <span className="kv-value metric-number">{fmt(manual.raw_prompt_tokens)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">2) Decision making (prompt analysis) tokens</span>
        <span className="kv-value metric-number">{fmt(manual.decision_making_tokens)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">3) Estimated tokens to generate the questions</span>
        <span className="kv-value metric-number">{fmt(manual.question_generation_tokens)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">4) Estimated user answer tokens (LLM-measured)</span>
        <span className="kv-value metric-number">{fmt(manual.estimated_answer_tokens)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">
          5) Total tokens to execute all questions
          <span className="ml-1.5 text-[0.65rem] text-[#6B7686] italic normal-case">— every question round, summed</span>
        </span>
        <span className="kv-value metric-number">{fmt(manual.estimated_execution_tokens)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">6) Estimated tokens to analyze the answers</span>
        <span className="kv-value metric-number">{fmt(manual.estimated_answer_analysis_tokens)}</span>
      </div>
      {Array.isArray(manual.answer_tokens_by_question) && manual.answer_tokens_by_question.length > 0 && (
        <div className="py-2 px-2">
          <div className="flex flex-wrap gap-1.5">
            {manual.answer_tokens_by_question.map((t, i) => (
              <span key={i} className="badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]">
                Q{i + 1} answer: {fmt(t)} tok
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="kv-row">
        <span className="kv-label font-semibold text-[#E6EAF2]">Total Estimated Manual Tokens</span>
        <span className="kv-value metric-number text-[#E8C079] font-semibold text-base">
          {fmt(manual.total_estimated_manual_tokens)}
        </span>
      </div>
    </div>

    <div className="surface-subtle p-4 text-center mb-4 border-[#E0A93B]/20">
      <p className="stat-label mb-1">Total Projected Manual Cost (before optimization)</p>
      <p className="stat-value-lg text-[#E8C079]">{fmtMoney(manual.estimated_manual_cost)}</p>
    </div>

    <div className="text-center p-3 surface-subtle">
      <p className="text-xs text-[#6B7686] italic">
        {beforeOptimization
          ? `💡 A total of ${fmt(manual.total_estimated_manual_tokens)} tokens would have been used if you did this manually before the prompt is optimized.`
          : `💡 Note: A total of ${fmt(manual.total_estimated_manual_tokens)} tokens would have been used if you did this manually.`}
      </p>
    </div>

    {clarification.num_questions > 0 && (
      <div className="mt-4 surface-subtle p-3 border-[#4F7CFF]/15">
        <p className="text-xs text-[#8FB0FF] leading-relaxed">
          <strong>{clarification.num_questions} clarification questions</strong> were identified as required to reach
          the desired goal. Row 5 executes the task once per question, so its total grows with every
          answer — that's why question-heavy prompts cost more before optimization.
        </p>
      </div>
    )}
  </section>
);
