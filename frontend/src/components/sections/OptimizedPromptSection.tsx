// src/components/sections/OptimizedPromptSection.tsx
import React, { useState, useCallback } from 'react';
import { Wand2, Copy, Check, FileText, ScanSearch, Layers, Zap, Sigma } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OptimizedPromptResult, SkillResult, OptimizerAnalytics } from '../../types/optimizer';
import { SectionHeading } from '../ui/SectionHeading';
import { fmt, fmtMoney } from '../../utils/format';

interface OptimizedPromptSectionProps {
  optimizedPrompt: OptimizedPromptResult;
  skill: SkillResult;
  analytics?: OptimizerAnalytics;
}

const StatTile: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}> = ({ icon: Icon, label, value, sub, valueClass }) => (
  <div className="surface p-4">
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon size={13} className="text-[#6B7686]" />
      <p className="stat-label">{label}</p>
    </div>
    <p className={`stat-value-lg metric-number ${valueClass ?? 'text-[#C6CDD9]'}`}>{value}</p>
    <p className="text-[11px] text-[#6B7686] mt-1">{sub}</p>
  </div>
);

export const OptimizedPromptSection: React.FC<OptimizedPromptSectionProps> = ({
  optimizedPrompt, skill, analytics,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = optimizedPrompt.text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [optimizedPrompt.text]);

  return (
    <section id="optimized-prompt" className="animate-slide-up">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <SectionHeading
          icon={Wand2}
          title="Optimized Prompt"
          subtitle={`Ready to paste into any AI — built with the ${skill.name} framework`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge text-[#8FB0FF] border-[#4F7CFF]/30 bg-[#4F7CFF]/10">
            <Wand2 size={11} />
            {skill.name}
          </span>
          <button
            id="copy-optimized-prompt"
            onClick={handleCopy}
            className={`btn-primary ${copied ? '!bg-[#2FB67B]' : ''}`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>
      </div>

      {/* Prompt panel */}
      <div className="surface overflow-hidden">
        <div className="flex items-center px-4 py-2.5 bg-[#10141C] border-b border-[#232A36]">
          <span className="text-xs font-mono text-[#6B7686]">optimized-prompt.txt</span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#59C99A] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FB67B] pulse-dot" />
            ready to use
          </span>
        </div>
        <div className="p-5 sm:p-6 max-h-[520px] overflow-y-auto">
          <div className="prompt-body text-[0.95rem]">{optimizedPrompt.text}</div>
        </div>
      </div>

      {/* Component tokens — the four parts of the optimizer run */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatTile
          icon={FileText}
          label="Raw Prompt"
          value={fmt(analytics?.raw_prompt_tokens ?? 0)}
          valueClass="text-[#8FB0FF]"
          sub="original prompt text tokens"
        />
        <StatTile
          icon={ScanSearch}
          label="Skill Selection"
          value={fmt(analytics?.skill_selection_tokens ?? 0)}
          valueClass="text-[#C6CDD9]"
          sub="LLM tokens consumed to pick the framework"
        />
        <StatTile
          icon={Layers}
          label="Optimization"
          value={fmt(optimizedPrompt.optimization_tokens_used)}
          valueClass="text-[#C6CDD9]"
          sub="LLM tokens consumed to rewrite the prompt"
        />
        <StatTile
          icon={Zap}
          label="Execution"
          value={fmt(analytics?.estimated_execution_tokens ?? 0)}
          valueClass="text-[#59C99A]"
          sub="real measured run of the optimized prompt"
        />
      </div>

      {/* Reconciliation: the four parts must sum to the optimizer total */}
      {analytics && (
        <div className="surface-subtle p-4 mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#9AA4B2] font-mono">
            <span className="text-[#6B7686] font-sans">Optimizer run ·</span>{' '}
            {fmt(analytics.raw_prompt_tokens)} + {fmt(analytics.skill_selection_tokens)} +{' '}
            {fmt(analytics.optimization_tokens)} + {fmt(analytics.estimated_execution_tokens)} ={' '}
            <span className="font-semibold text-[#8FB0FF]">{fmt(analytics.total_optimizer_tokens)} tokens</span>
          </p>
          <p className="text-xs font-mono text-[#E8C079] font-semibold">
            <Sigma size={11} className="inline mr-1 -mt-0.5" />
            {fmtMoney(analytics.estimated_optimizer_cost)}
          </p>
        </div>
      )}
    </section>
  );
};