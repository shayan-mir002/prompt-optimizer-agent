// src/components/sections/ComparisonSection.tsx
import React from 'react';
import { ArrowLeftRight, ArrowDownRight } from 'lucide-react';
import type { ComparisonResult } from '../../types/optimizer';
import { SectionHeading } from '../ui/SectionHeading';
import { fmt, fmtMoney, fmtPct } from '../../utils/format';

interface ComparisonSectionProps {
  comparison: ComparisonResult;
}

const LaneChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]">{label}</span>
);

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ comparison }) => (
  <section id="comparison" className="section-card animate-slide-up">
    <SectionHeading
      icon={ArrowLeftRight}
      title="Before vs After"
      subtitle="What you'd spend doing it manually versus one optimized run"
    />

    {/* Lanes */}
    <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 mt-5 items-stretch">
      {/* Manual */}
      <div className="surface relative overflow-hidden p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,#C7912E,#E0A93B)' }} />
        <p className="stat-label text-[#E8C079]">Manual Workflow</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="stat-value-xl text-[#E8C079] metric-number">{fmt(comparison.manual_tokens)}</span>
          <span className="text-xs text-[#6B7686]">tokens</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {comparison.estimated_questions_required > 0 && (
            <LaneChip label={`${comparison.estimated_questions_required} question rounds`} />
          )}
          <LaneChip label="answers" />
          <LaneChip label="analysis" />
          <LaneChip label="execution" />
        </div>
      </div>

      {/* Center savings */}
      <div className="flex flex-col items-center justify-center gap-2 px-2">
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#2FB67B]/10 border border-[#2FB67B]/30">
          <ArrowDownRight size={20} className="text-[#59C99A]" />
        </div>
        <span className="badge text-[#59C99A] border-[#2FB67B]/30 bg-[#2FB67B]/10">
          -{fmtPct(comparison.percentage_reduction)} tokens
        </span>
        <span className="text-[0.7rem] text-[#6B7686]">saved</span>
      </div>

      {/* Optimizer */}
      <div className="surface relative overflow-hidden p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,#4F7CFF,#7BA2FF)' }} />
        <p className="stat-label text-[#8FB0FF]">Optimizer Pipeline</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="stat-value-xl text-[#8FB0FF] metric-number">{fmt(comparison.optimizer_tokens)}</span>
          <span className="text-xs text-[#6B7686]">tokens</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <LaneChip label="raw prompt" />
          <LaneChip label="skill selection" />
          <LaneChip label="optimization" />
          <LaneChip label="execution" />
        </div>
      </div>
    </div>

    {/* Cost summary */}
    <div className="grid sm:grid-cols-3 gap-4 mt-4">
      <div className="surface p-4 text-center">
        <p className="stat-label mb-2">Manual Cost</p>
        <p className="stat-value-lg text-[#E8C079] metric-number">{fmtMoney(comparison.manual_cost)}</p>
      </div>
      <div className="surface relative overflow-hidden p-4 text-center border border-[#2FB67B]/25">
        <p className="stat-label mb-2 text-[#59C99A]">Estimated Savings</p>
        <p className="stat-value-lg text-[#59C99A] metric-number">{fmtMoney(comparison.estimated_cost_saved)}</p>
      </div>
      <div className="surface p-4 text-center">
        <p className="stat-label mb-2">Optimizer Cost</p>
        <p className="stat-value-lg text-[#8FB0FF] metric-number">{fmtMoney(comparison.optimizer_cost)}</p>
      </div>
    </div>

    <p className="text-[11px] text-[#6B7686] mt-5 leading-relaxed">
      Optimizer total = raw prompt + skill selection + prompt optimization + estimated
      execution. Manual total = raw prompt + decision making + questions + user answers +
      execution + answer analysis. Savings are the difference, priced at the model's
      per-1K-token rates.
    </p>
  </section>
);