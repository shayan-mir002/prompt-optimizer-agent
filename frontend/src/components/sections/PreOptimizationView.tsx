// src/components/sections/PreOptimizationView.tsx
import React from 'react';
import { SearchCheck, AlertTriangle, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import type { PreOptimizationResponse } from '../../types/optimizer';
import { RawPromptSection } from './RawPromptSection';
import { AnalysisSection } from './AnalysisSection';
import { ClarificationSection } from './ClarificationSection';
import { ManualWorkflowSection } from './ManualWorkflowSection';

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
        <div className="glass rounded-2xl border border-rose-500/20 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle size={18} className="text-rose-400" />
            <h2 className="text-base font-semibold text-white">Prompt Validation Failed</h2>
          </div>
          <ul className="space-y-2 mb-5">
            {pre.validation.errors.map((e, i) => (
              <li key={i} className="text-sm text-rose-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors"
          >
            ← Back to Input
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Step banner */}
      <div className="section-card glass border border-indigo-500/20 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15">
            <SearchCheck size={18} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
              Step 1 of 2 — Analysis Complete
            </p>
            <h2 className="text-sm font-semibold text-white">
              {pre.prompt_is_clear
                ? 'Your prompt is sufficiently clear — no clarification questions needed.'
                : 'The prompt lacks clarity — here is what the AI needs to know.'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              The full pipeline has NOT been run yet. Review the projected manual
              token usage below before proceeding to the optimizer.
            </p>
          </div>
          <span className="tag-pill bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0">
            {pre.raw_prompt_tokens} raw tokens
          </span>
        </div>
      </div>

      <RawPromptSection prompt={rawPrompt} tokens={pre.raw_prompt_tokens} />

      {pre.analysis && <AnalysisSection analysis={pre.analysis} />}

      {pre.clarification && <ClarificationSection clarification={pre.clarification} />}

      {pre.manual_projection && pre.clarification && (
        <ManualWorkflowSection manual={pre.manual_projection} clarification={pre.clarification} beforeOptimization />
      )}

      {/* Before-optimization total + CTA */}
      <div className="section-card glass-strong border border-indigo-500/20 animate-slide-up">
        <div className="text-center mb-5">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
            Total Before Prompt Is Optimized
          </p>
          {pre.manual_projection && (
            <>
              <p className="text-3xl font-black gradient-text metric-number mb-1">
                {pre.manual_projection.total_estimated_manual_tokens.toLocaleString()} tokens
              </p>
              <p className="text-xs text-slate-500">
                ≈ ${pre.manual_projection.estimated_manual_cost.toFixed(6)} · if done manually
              </p>
            </>
          )}
          <p className="text-xs text-slate-400 italic mt-3 max-w-lg mx-auto font-sans">
            💡 {pre.note}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onProceed}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${loading
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 glow-indigo hover:scale-[1.02]'
              }`}
          >
            <Sparkles size={15} />
            {loading ? 'Optimizing...' : 'Proceed to Optimize'}
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={13} />
            Back to Input
          </button>
        </div>
      </div>
    </div>
  );
};
