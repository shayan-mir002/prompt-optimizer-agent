// src/components/sections/PreOptimizationView.tsx
import React from 'react';
import { SearchCheck, AlertTriangle, Sparkles, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { PreOptimizationResponse } from '../../types/optimizer';
import { RawPromptSection } from './RawPromptSection';
import { AnalysisSection } from './AnalysisSection';
import { ClarificationSection } from './ClarificationSection';
import { ManualWorkflowSection } from './ManualWorkflowSection';
import { Badge } from '../ui/Badge';
import { fmt, fmtMoney } from '../../utils/format';

interface PreOptimizationViewProps {
  pre: PreOptimizationResponse;
  rawPrompt: string;
  onProceed: () => void;
  onBack: () => void;
  loading: boolean;
}

export const PreOptimizationView: React.FC<PreOptimizationViewProps> = ({
  pre, rawPrompt, onProceed, onBack, loading,
}) => {
  if (!pre.validation.is_valid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        <div className="surface border border-[#E5677E]/20 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle size={18} className="text-[#F09AA8]" />
            <h2 className="text-base font-semibold text-[#E6EAF2]">Prompt Validation Failed</h2>
          </div>
          <ul className="space-y-2 mb-5">
            {pre.validation.errors.map((e, i) => (
              <li key={i} className="text-sm text-[#F09AA8] flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5677E] mt-1.5 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
          <button
            onClick={onBack}
            className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <RotateCcw size={13} />
            Back to Input
          </button>
        </div>
      </div>
    );
  }

  // The prompt is already clear — optimization would add nothing.
  if (pre.prompt_is_clear) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="section-card border border-[#2FB67B]/30">
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-3 rounded-full bg-[#2FB67B]/10 border border-[#2FB67B]/30 mb-4">
              <CheckCircle2 size={26} className="text-[#59C99A]" />
            </div>
            <p className="text-[10px] font-bold text-[#59C99A] uppercase tracking-widest mb-2">
              Step 1 of 2 — Analysis Complete
            </p>
            <h2 className="text-xl font-bold text-[#E6EAF2] mb-2">
              This prompt doesn't need optimization
            </h2>
            <p className="text-sm text-[#9AA4B2] max-w-md text-center leading-relaxed">
              {pre.analysis
                ? `It's already clear and complete — ${pre.analysis.ambiguity_level} ambiguity, ` +
                  `quality ${pre.analysis.quality_score}/10, completeness ${pre.analysis.completeness_score}%. ` +
                  'No clarification questions are required.'
                : 'The prompt is sufficiently clear — no clarification questions are required.'}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Badge label={`${pre.raw_prompt_tokens} raw tokens`} tone="emerald" />
              {pre.manual_projection && (
                <Badge label={`${fmt(pre.manual_projection.total_estimated_manual_tokens)} projected manual tokens`} tone="neutral" />
              )}
            </div>
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5 px-5 py-2.5 text-sm mt-6"
            >
              <RotateCcw size={13} />
              Analyze Another Prompt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Step banner */}
      <div className="section-card animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#4F7CFF]/10 border border-[#4F7CFF]/25">
            <SearchCheck size={18} className="text-[#7BA2FF]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#7BA2FF] uppercase tracking-widest mb-0.5">
              Step 1 of 2 — Analysis Complete
            </p>
            <h2 className="text-sm font-semibold text-[#E6EAF2]">
              The prompt lacks clarity — here is what the AI needs to know.
            </h2>
            <p className="text-xs text-[#6B7686] mt-1">
              The full pipeline has NOT been run yet. Review the projected manual
              token usage below before proceeding to the optimizer.
            </p>
          </div>
          <Badge label={`${pre.raw_prompt_tokens} raw tokens`} tone="neutral" />
        </div>
      </div>

      <RawPromptSection prompt={rawPrompt} tokens={pre.raw_prompt_tokens} />

      {pre.analysis && <AnalysisSection analysis={pre.analysis} />}

      {pre.clarification && <ClarificationSection clarification={pre.clarification} />}

      {pre.manual_projection && pre.clarification && (
        <ManualWorkflowSection manual={pre.manual_projection} clarification={pre.clarification} beforeOptimization />
      )}

      {/* Before-optimization total + CTA */}
      <div className="section-card animate-slide-up">
        <div className="text-center mb-5">
          <p className="stat-label mb-2">
            Total Before Prompt Is Optimized
          </p>
          {pre.manual_projection && (
            <>
              <p className="stat-value-lg text-[#8FB0FF] metric-number mb-1">
                {fmt(pre.manual_projection.total_estimated_manual_tokens)} tokens
              </p>
              <p className="text-xs text-[#6B7686]">
                ≈ {fmtMoney(pre.manual_projection.estimated_manual_cost)} · if done manually
              </p>
            </>
          )}
          <p className="text-xs text-[#6B7686] italic mt-3 max-w-lg mx-auto">
            {pre.note}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onProceed}
            disabled={loading}
            className={`btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Sparkles size={15} />
            {loading ? 'Optimizing...' : 'Proceed to Optimize'}
          </button>
          <button
            onClick={onBack}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 px-4 py-3 text-sm"
          >
            <RotateCcw size={13} />
            Back to Input
          </button>
        </div>
      </div>
    </div>
  );
};