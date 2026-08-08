// src/components/sections/TokenAnalyticsSection.tsx
import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { OptimizerAnalytics } from '../../types/optimizer';

interface TokenAnalyticsSectionProps {
  analytics: OptimizerAnalytics;
}

interface TokenBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  estimated?: boolean;
}

const TokenBar: React.FC<TokenBarProps> = ({ label, value, max, color, estimated }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="group font-sans">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">{label}</span>
          {estimated && <span className="text-[9px] text-amber-400 font-semibold">(est.)</span>}
        </div>
        <span className="text-xs font-semibold text-slate-300 metric-number">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} progress-bar-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const TokenAnalyticsSection: React.FC<TokenAnalyticsSectionProps> = ({ analytics }) => {
  const maxVal = Math.max(
    analytics.raw_prompt_tokens,
    analytics.decision_making_tokens,
    analytics.skill_selection_tokens,
    analytics.optimization_tokens,
    analytics.estimated_execution_tokens,
  );

  const bars = [
    { label: 'Raw Prompt Tokens', value: analytics.raw_prompt_tokens, color: 'bg-slate-400' },
    { label: 'Validation Tokens', value: analytics.validation_tokens, color: 'bg-rose-400' },
    { label: 'Prompt Analysis Tokens', value: analytics.decision_making_tokens, color: 'bg-indigo-400' },
    { label: 'Skill Selection Tokens', value: analytics.skill_selection_tokens, color: 'bg-emerald-400' },
    { label: 'Prompt Optimization Tokens', value: analytics.optimization_tokens, color: 'bg-indigo-300' },
    { label: 'Optimization Overhead (internal)', value: analytics.optimization_overhead_tokens, color: 'bg-amber-300' },
    { label: 'Estimated Execution Tokens', value: analytics.estimated_execution_tokens, color: 'bg-cyan-400', estimated: true },
  ];

  return (
    <section id="token-analytics" className="section-card glass border border-white/5 animate-slide-up">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <BarChart2 size={16} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Token Analytics</h2>
          <p className="text-xs text-slate-500">Phase 8 — Token distribution across pipeline stages</p>
        </div>
      </div>

      <div className="space-y-4">
        {bars.map(bar => (
          <TokenBar key={bar.label} {...bar} max={maxVal} />
        ))}
      </div>

      <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/5 border border-indigo-500/15 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Total Estimated Optimizer Tokens</span>
        <span className="text-xl font-black gradient-text metric-number">
          {analytics.total_optimizer_tokens.toLocaleString()}
        </span>
      </div>
    </section>
  );
};
