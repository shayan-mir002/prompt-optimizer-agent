// src/components/sections/ComparisonSection.tsx
import React from 'react';
import { ArrowLeftRight, TrendingDown, Coins, MessageSquare } from 'lucide-react';
import type { ComparisonResult } from '../../types/optimizer';

interface ComparisonSectionProps {
  comparison: ComparisonResult;
}

interface CompBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  textColor: string;
}

const CompBar: React.FC<CompBarProps> = ({ label, value, max, color, textColor }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className={`text-sm font-bold metric-number ${textColor}`}>{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`comparison-bar h-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ comparison }) => {
  const maxTokens = Math.max(comparison.manual_tokens, comparison.optimizer_tokens);

  return (
    <section id="comparison" className="section-card glass border border-white/5 animate-slide-up">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-rose-500/10">
          <ArrowLeftRight size={16} className="text-rose-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Comparison Dashboard</h2>
          <p className="text-xs text-slate-500">Phase 10 — Manual workflow vs Optimizer total</p>
        </div>
      </div>

      {/* Token comparison bars */}
      <div className="space-y-4 mb-6">
        <CompBar
          label="Manual Workflow Tokens"
          value={comparison.manual_tokens}
          max={maxTokens}
          color="bg-gradient-to-r from-amber-500 to-orange-500"
          textColor="text-amber-300"
        />
        <CompBar
          label="Optimizer Total Tokens"
          value={comparison.optimizer_tokens}
          max={maxTokens}
          color="bg-gradient-to-r from-indigo-500 to-cyan-500"
          textColor="text-indigo-300"
        />
      </div>

      <div className="mb-4 p-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
        Optimizer total = raw prompt + skill selection + prompt optimization +
        estimated execution. Manual total includes raw prompt + decision making +
        questions + answers + execution + answer analysis.
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 stagger-children">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 text-center">
          <TrendingDown size={18} className="text-emerald-400 mx-auto mb-1.5" />
          <p className="text-2xl font-black text-emerald-300 metric-number">
            {comparison.percentage_reduction.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Token Reduction</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/20 text-center">
          <Coins size={18} className="text-cyan-400 mx-auto mb-1.5" />
          <p className="text-2xl font-black text-cyan-300 metric-number">
            ${comparison.estimated_cost_saved.toFixed(6)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cost Saved</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 border border-indigo-500/20 text-center">
          <ArrowLeftRight size={18} className="text-indigo-400 mx-auto mb-1.5" />
          <p className="text-2xl font-black text-indigo-300 metric-number">
            {comparison.tokens_saved.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Tokens Saved</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-500/20 text-center">
          <MessageSquare size={18} className="text-rose-400 mx-auto mb-1.5" />
          <p className="text-2xl font-black text-rose-300 metric-number">
            {comparison.estimated_questions_required}
          </p>
          <p className="text-xs text-slate-400 mt-1">Questions Eliminated</p>
        </div>
      </div>

      {/* Cost comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/15 text-center">
          <p className="text-[10px] text-amber-400 mb-1">Manual Cost</p>
          <p className="text-base font-bold text-amber-300">${comparison.manual_cost.toFixed(6)}</p>
        </div>
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-center">
          <p className="text-[10px] text-indigo-400 mb-1">Optimizer Cost</p>
          <p className="text-base font-bold text-indigo-300">${comparison.optimizer_cost.toFixed(6)}</p>
        </div>
      </div>
    </section>
  );
};
