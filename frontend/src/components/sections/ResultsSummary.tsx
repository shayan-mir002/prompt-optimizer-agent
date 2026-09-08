// src/components/sections/ResultsSummary.tsx
import React from 'react';
import { TrendingDown, Coins, Wand2, MessageSquare } from 'lucide-react';
import type { ComparisonResult } from '../../types/optimizer';
import { KpiCard } from '../ui/KpiCard';
import { fmt, fmtMoney, fmtPct } from '../../utils/format';

interface ResultsSummaryProps {
  comparison: ComparisonResult;
  skillName?: string;
  modelName?: string;
}

const NAV_TARGETS = [
  { id: 'optimized-prompt', label: 'Optimized Prompt', step: '01' },
  { id: 'comparison', label: 'Before vs After', step: '02' },
];

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  comparison, skillName, modelName,
}) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="results-summary" className="animate-slide-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="badge text-[#8FB0FF] border-[#4F7CFF]/30 bg-[#4F7CFF]/10">
          Step 2 · Optimization Results
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {modelName && (
            <span className="badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]">
              Model · <span className="font-mono text-[#C6CDD9]">{modelName}</span>
            </span>
          )}
          {skillName && (
            <span className="badge text-[#59C99A] border-[#2FB67B]/30 bg-[#2FB67B]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FB67B]" />
              {skillName}
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full bg-[#4F7CFF]/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-lg">
            <h1 className="hero-title">Your prompt, tuned to perform.</h1>
            <p className="text-sm text-[#9AA4B2] mt-2 leading-relaxed">
              {skillName
                ? `Rebuilt with the ${skillName} framework — structure, clarity and efficiency rewritten in one pass.`
                : 'Rebuilt for clarity, structure and efficiency in one pass.'}{' '}
              {comparison.estimated_questions_required > 0
                ? `${comparison.estimated_questions_required} round-trips of manual back-and-forth were collapsed into a single run.`
                : 'No clarification round-trips were needed.'}
            </p>
          </div>

          {/* Savings highlight */}
          <div className="flex items-end gap-5 flex-wrap">
            <div className="text-right">
              <p className="stat-label mb-1 text-[#2FB67B]">Token Reduction</p>
              <p className="stat-value-xl text-[#59C99A] metric-number">
                -{fmtPct(comparison.percentage_reduction)}
              </p>
              <p className="text-xs text-[#6B7686] mt-1">
                {fmt(comparison.tokens_saved)} tokens saved
              </p>
            </div>
            <div className="hidden sm:block h-12 w-px bg-[#232A36]" />
            <div className="text-right">
              <p className="stat-label mb-1 text-[#7BA2FF]">Cost Impact</p>
              <p className="stat-value-xl text-[#8FB0FF] metric-number">
                {fmtMoney(comparison.estimated_cost_saved)}
              </p>
              <p className="text-xs text-[#6B7686] mt-1">saved vs manual workflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <KpiCard
          label="Tokens Saved"
          value={fmt(comparison.tokens_saved)}
          sub={comparison.tokens_saved >= 0 ? 'fewer than the manual route' : 'slightly more than manual'}
          pitch={{ text: `-${fmtPct(comparison.percentage_reduction)}`, tone: 'good' }}
          icon={TrendingDown}
          accent="emerald"
          helper="Manual workflow tokens − optimizer total tokens"
        />
        <KpiCard
          label="Cost Saved"
          value={fmtMoney(comparison.estimated_cost_saved)}
          sub={`optimizer ${fmtMoney(comparison.optimizer_cost)} vs manual ${fmtMoney(comparison.manual_cost)}`}
          icon={Coins}
          accent="blue"
          helper="Manual workflow cost − optimizer pipeline cost (at current model prices)"
        />
        <KpiCard
          label="Optimizer Cost"
          value={fmtMoney(comparison.optimizer_cost)}
          sub="one optimized run, end to end"
          icon={Wand2}
          accent="zinc"
          helper="Raw prompt + skill selection + prompt optimization + estimated execution"
        />
        <KpiCard
          label="Round-Trips Removed"
          value={comparison.estimated_questions_required}
          sub="clarification rounds eliminated"
          icon={MessageSquare}
          accent="amber"
          helper="How many manual ask → answer cycles the optimizer saved"
        />
      </div>

      {/* Results navigation */}
      <nav className="flex flex-wrap items-center gap-2 mt-5">
        {NAV_TARGETS.map(({ id, label, step }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <span className="font-mono text-[0.7rem] text-[#6B7686]">{step}</span>
            {label}
          </button>
        ))}
      </nav>
    </section>
  );
};