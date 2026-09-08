// src/components/sections/ClarificationSection.tsx
import React from 'react';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import type { ClarificationResult } from '../../types/optimizer';
import { SectionHeading } from '../ui/SectionHeading';
import { TokenChip } from '../ui/TokenChip';
import { fmt } from '../../utils/format';

interface ClarificationSectionProps {
  clarification: ClarificationResult;
}

export const ClarificationSection: React.FC<ClarificationSectionProps> = ({ clarification }) => (
  <section id="clarification" className="section-card animate-slide-up">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <SectionHeading
        icon={MessageSquare}
        title="Clarification Questions"
        subtitle="Questions the model would ask a human to disambiguate the task"
      />
      <TokenChip
        count={clarification.question_generation_tokens}
        label="questions tokens consumed"
        kind="compute"
      />
    </div>

    {clarification.questions.length > 0 ? (
      <div className="space-y-2.5">
        {clarification.questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 surface-subtle">
            <div className="w-5 h-5 rounded-full bg-[#4F7CFF]/15 border border-[#4F7CFF]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-[#8FB0FF]">{i + 1}</span>
            </div>
            <p className="text-sm text-[#C6CDD9] leading-relaxed">{q}</p>
          </div>
        ))}
        <p className="text-xs text-[#6B7686] pt-1 px-1">
          Total tokens for question text: {fmt(clarification.question_text_tokens)} · estimated answers: {fmt(clarification.estimated_answer_tokens)} tokens
        </p>
      </div>
    ) : (
      <div className="surface-subtle p-4 border-[#2FB67B]/25 text-center">
        <CheckCircle2 size={18} className="text-[#59C99A] mx-auto mb-2" />
        <p className="text-sm text-[#59C99A]">No clarification questions needed — the prompt is sufficiently clear.</p>
      </div>
    )}
  </section>
);