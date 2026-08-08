// src/components/sections/ManualWorkflowSection.tsx
import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import type { ManualProjection, ClarificationResult } from '../../types/optimizer';

interface ManualWorkflowSectionProps {
  manual: ManualProjection;
  clarification: ClarificationResult;
  beforeOptimization?: boolean;
}

const Row: React.FC<{ label: string; value: string | number; estimated?: boolean; accent?: string; muted?: boolean }> = ({
  label, value, estimated, accent = 'text-slate-200', muted,
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2">
      <span className={`text-xs ${muted ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      {estimated && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-sans">
          est.
        </span>
      )}
    </div>
    <span className={`text-sm font-semibold metric-number ${accent}`}>{value}</span>
  </div>
);

export const ManualWorkflowSection: React.FC<ManualWorkflowSectionProps> = ({
  manual, clarification, beforeOptimization = true,
}) => (
  <section id="manual-workflow" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-amber-500/10">
        <Users size={16} className="text-amber-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">
          {beforeOptimization ? 'Before Optimization — Manual Workflow Projection' : 'Manual Workflow Projection'}
        </h2>
        <p className="text-xs text-slate-500">
          {beforeOptimization
            ? 'Step 1 — Total tokens & cost if you refined this prompt manually'
            : 'Phase 9 — Simulated traditional Q&A workflow'}
        </p>
      </div>
    </div>

    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2 mb-4">
      <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-300/80 leading-relaxed font-sans">
        This workflow is <strong>simulated</strong>. The AI plays the user — it generates the answers to the
        clarification questions — but every token figure shown is the model's <strong>real measured usage</strong>,
        returned by the API itself. No token count here is guessed.
      </p>
    </div>

    <div className="divide-y divide-white/5 mb-5">
      <Row label="1) Estimated tokens for prompt text" value={manual.raw_prompt_tokens} estimated />
      <Row label="2) Estimated tokens to generate the questions" value={manual.question_generation_tokens} estimated />
      <Row
        label="3) Estimated user answer tokens (LLM-measured)"
        value={manual.estimated_answer_tokens}
        estimated
      />
      <Row label="4) Estimated tokens to execute the answers" value={manual.estimated_execution_tokens} estimated />
      {Array.isArray(manual.answer_tokens_by_question) && manual.answer_tokens_by_question.length > 0 && (
        <div className="py-2 border-b border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {manual.answer_tokens_by_question.map((t, i) => (
              <span
                key={i}
                className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded"
              >
                Q{i + 1} answer: {t} tok
              </span>
            ))}
          </div>
        </div>
      )}
      <Row label="Total Estimated Manual Tokens" value={manual.total_estimated_manual_tokens} accent="text-amber-300" />
    </div>

    <div className="mb-4 p-3 rounded-xl bg-white/3 border border-white/5">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Not counted (optimizer-style overhead)</p>
      <Row label="Decision making (prompt analysis) tokens" value={manual.decision_making_tokens} muted />
      <Row label="Answer analysis tokens" value={manual.estimated_answer_analysis_tokens} muted />
    </div>

    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center mb-4">
      <p className="text-xs text-amber-400 mb-1">Total Estimated Manual Cost (before optimization)</p>
      <p className="text-2xl font-black text-amber-300">${manual.estimated_manual_cost.toFixed(6)}</p>
    </div>

    <div className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
      <p className="text-xs text-slate-400 italic">
        💡 {beforeOptimization
          ? `A total of ${manual.total_estimated_manual_tokens.toLocaleString()} tokens would have been used if you did this manually before the prompt is optimized.`
          : `Note: A total of ${manual.total_estimated_manual_tokens.toLocaleString()} tokens would have been used if you did this manually.`}
      </p>
    </div>

    {clarification.num_questions > 0 && (
      <div className="mt-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
        <p className="text-xs text-cyan-300/80 leading-relaxed">
          <strong>{clarification.num_questions} clarification questions</strong> were identified as required to reach
          the desired goal. The estimated answer tokens above simulate human responses to these questions.
        </p>
      </div>
    )}
  </section>
);
