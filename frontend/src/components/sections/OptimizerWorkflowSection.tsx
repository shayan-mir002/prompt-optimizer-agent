// src/components/sections/OptimizerWorkflowSection.tsx
import React from 'react';
import { Bot } from 'lucide-react';
import type { OptimizerAnalytics, ExecutionEstimationResult } from '../../types/optimizer';

interface OptimizerWorkflowSectionProps {
  analytics: OptimizerAnalytics;
  execution: ExecutionEstimationResult;
}

const Row: React.FC<{ label: string; value: number; accent?: string; estimated?: boolean }> = ({
  label, value, accent = 'text-slate-200', estimated,
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      {estimated && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-sans">
          est.
        </span>
      )}
    </div>
    <span className={`text-sm font-semibold metric-number ${accent}`}>{value.toLocaleString()}</span>
  </div>
);

export const OptimizerWorkflowSection: React.FC<OptimizerWorkflowSectionProps> = ({ analytics, execution }) => (
  <section id="optimizer-workflow" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-indigo-500/10">
        <Bot size={16} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Optimizer Workflow</h2>
        <p className="text-xs text-slate-500">Phase 8 — Complete pipeline token breakdown</p>
      </div>
    </div>

    <div className="divide-y divide-white/5">
      <Row label="Raw Prompt Tokens" value={analytics.raw_prompt_tokens} />
      <Row label="Skill Selection Tokens" value={analytics.skill_selection_tokens} />
      <Row label="Prompt Optimization Tokens" value={analytics.optimization_tokens} />
      <div className="pt-2 pb-1">
        <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Estimated Prompt Execution</p>
      </div>
      <Row label="Estimated Execution Tokens" value={analytics.estimated_execution_tokens} estimated accent="text-cyan-300" />
      <Row label="Total Optimizer Tokens (raw + skill selection + optimization + execution)" value={analytics.total_optimizer_tokens} accent="text-indigo-300" />
    </div>

    {/* Execution detail */}
    <div className="mt-4 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Execution Estimation Detail (target model consumes the optimized prompt)</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-slate-500">Input</p>
          <p className="text-sm font-bold text-cyan-300">{execution.input_tokens.toLocaleString()}</p>
          <p className="text-[10px] text-slate-600">${execution.estimated_input_cost.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Output (est.)</p>
          <p className="text-sm font-bold text-cyan-300">{execution.estimated_output_tokens.toLocaleString()}</p>
          <p className="text-[10px] text-slate-600">${execution.estimated_output_cost.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total (est.)</p>
          <p className="text-sm font-bold text-indigo-300">{execution.total_estimated_tokens.toLocaleString()}</p>
          <p className="text-[10px] text-slate-600">${execution.estimated_total_cost.toFixed(6)}</p>
        </div>
      </div>
    </div>

    {/* Cost summary */}
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
        <p className="text-xs text-slate-500 mb-1">Overhead Input Cost</p>
        <p className="text-base font-bold text-indigo-300">${analytics.estimated_optimizer_input_cost.toFixed(6)}</p>
      </div>
      <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
        <p className="text-xs text-slate-500 mb-1">Overhead Output Cost</p>
        <p className="text-base font-bold text-indigo-300">${analytics.estimated_optimizer_output_cost.toFixed(6)}</p>
      </div>
      <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-center">
        <p className="text-xs text-cyan-400 mb-1">Estimated Execution Cost</p>
        <p className="text-base font-bold text-cyan-300">${analytics.estimated_execution_cost.toFixed(6)}</p>
      </div>
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
        <p className="text-xs text-indigo-400 mb-1">Total Estimated Optimizer Cost</p>
        <p className="text-base font-bold text-indigo-300">${analytics.estimated_optimizer_cost.toFixed(6)}</p>
      </div>
    </div>
  </section>
);
