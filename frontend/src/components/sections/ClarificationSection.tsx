// src/components/sections/ClarificationSection.tsx
import React from 'react';
import { MessageSquare, Hash, ListChecks } from 'lucide-react';
import type { ClarificationResult } from '../../types/optimizer';
import { MetricCard } from '../ui/MetricCard';

interface ClarificationSectionProps {
  clarification: ClarificationResult;
}

export const ClarificationSection: React.FC<ClarificationSectionProps> = ({ clarification }) => (
  <section id="clarification" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-cyan-500/10">
        <MessageSquare size={16} className="text-cyan-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Clarification Questions</h2>
        <p className="text-xs text-slate-500">First the AI plans how many questions are needed, then it generates them (no answers requested)</p>
      </div>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 stagger-children">
      <MetricCard label="Questions Required" value={clarification.num_questions} accent="cyan" />
      <MetricCard label="Count Planning Tokens" value={clarification.question_count_tokens} accent="indigo" />
      <MetricCard label="Question Text Tokens" value={clarification.question_text_tokens} accent="indigo" />
      <MetricCard label="Est. Answer Tokens" value={clarification.estimated_answer_tokens} accent="amber" estimated />    </div>

    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <ListChecks size={12} className="text-cyan-400" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Total question generation tokens (planning + text): {clarification.question_generation_tokens.toLocaleString()}
        </span>
      </div>
    </div>

    {/* Questions list */}
    {clarification.questions.length > 0 ? (
      <div className="space-y-2.5">
        {clarification.questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-cyan-400">{i + 1}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{q}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
        <p className="text-sm text-emerald-400">✓ No clarification questions needed — the prompt is sufficiently clear.</p>
      </div>
    )}
  </section>
);
