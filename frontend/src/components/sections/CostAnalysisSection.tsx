// src/components/sections/CostAnalysisSection.tsx
import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import type { OptimizerAnalytics, ExecutionEstimationResult } from '../../types/optimizer';

interface CostAnalysisSectionProps {
  analytics: OptimizerAnalytics;
  execution: ExecutionEstimationResult;
}

const PricingRow: React.FC<{ type: string; per1M: string; per1K: string }> = ({ type, per1M, per1K }) => (
  <div className="flex items-center justify-between py-1.5 text-xs">
    <span className="text-slate-400">{type}</span>
    <div className="flex gap-6">
      <span className="text-slate-300 font-medium">{per1M}/1M</span>
      <span className="text-slate-300 font-medium">{per1K}/1K</span>
    </div>
  </div>
);

export const CostAnalysisSection: React.FC<CostAnalysisSectionProps> = ({ analytics, execution }) => (
  <section id="cost-analysis" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-emerald-500/10">
        <DollarSign size={16} className="text-emerald-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Cost Analysis</h2>
        <p className="text-xs text-slate-500">Groq llama-3.3-70b pricing breakdown</p>
      </div>
    </div>

    {/* Pricing table */}
    <div className="mb-5 p-3.5 rounded-xl bg-black/20 border border-white/5">
      <div className="flex items-center gap-1.5 mb-2">
        <Info size={11} className="text-slate-500" />
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Groq llama-3.3-70b Pricing</p>
      </div>
      <div className="divide-y divide-white/5">
        <PricingRow type="Input Tokens"        per1M="$0.59"  per1K="$0.00059" />
        <PricingRow type="Cached Input Tokens" per1M="$0.59"  per1K="$0.00059" />
        <PricingRow type="Output Tokens"       per1M="$0.79"  per1K="$0.00079" />
      </div>
    </div>

    {/* Optimizer cost cards */}
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-center">
        <p className="text-[10px] text-slate-500 mb-1">Input Cost</p>
        <p className="text-sm font-bold text-indigo-300 metric-number">
          ${analytics.estimated_optimizer_input_cost.toFixed(6)}
        </p>
      </div>
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-center">
        <p className="text-[10px] text-slate-500 mb-1">Output Cost</p>
        <p className="text-sm font-bold text-indigo-300 metric-number">
          ${analytics.estimated_optimizer_output_cost.toFixed(6)}
        </p>
      </div>
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-center">
        <p className="text-[10px] text-slate-500 mb-1">Total</p>
        <p className="text-sm font-bold text-indigo-300 metric-number">
          ${analytics.estimated_optimizer_cost.toFixed(6)}
        </p>
      </div>
    </div>

    {/* Execution estimation cost */}
    <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
      <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2.5">
        Estimated Execution Cost (target model)
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Input ({execution.input_tokens} tkns)</p>
          <p className="text-sm font-bold text-cyan-300">${execution.estimated_input_cost.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Output (est. {execution.estimated_output_tokens} tkns)</p>
          <p className="text-sm font-bold text-cyan-300">${execution.estimated_output_cost.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Total Cost</p>
          <p className="text-sm font-bold text-white">${execution.estimated_total_cost.toFixed(6)}</p>
        </div>
      </div>
    </div>
  </section>
);
