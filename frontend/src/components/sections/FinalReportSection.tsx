// src/components/sections/FinalReportSection.tsx
import React, { useState, useCallback } from 'react';
import { ScrollText, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { FinalReport } from '../../types/optimizer';
import { Badge, complexityBadge, ambiguityBadge } from '../ui/Badge';

interface FinalReportSectionProps {
  report: FinalReport;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3.5 flex items-center gap-2">
    <span className="h-px flex-1 bg-white/10" />
    {children}
    <span className="h-px flex-1 bg-white/10" />
  </h3>
);

const DataRow: React.FC<{ label: string; value: string | number; mono?: boolean; estimated?: boolean }> = ({
  label, value, mono, estimated,
}) => (
  <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      {estimated && (
        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-semibold font-sans">est.</span>
      )}
    </div>
    <span className={`text-sm font-bold text-white text-right ${mono ? 'font-mono' : ''}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
  </div>
);

export const FinalReportSection: React.FC<FinalReportSectionProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const reportText = React.useMemo(() => {
    return [
      '═══════════════════════════════════════',
      '  PROMPT OPTIMIZATION REPORT',
      '═══════════════════════════════════════',
      '',
      '── OPTIMIZED PROMPT ──',
      report.optimized_prompt,
      '',
      '── PROMPT ANALYSIS ──',
      `Intent: ${report.intent}`,
      `Type: ${report.prompt_type}`,
      `Complexity: ${report.complexity}`,
      `Quality Score: ${report.quality_score}/10`,
      `Completeness: ${report.completeness_score}%`,
      `Ambiguity: ${report.ambiguity_level}`,
      `Missing: ${report.missing_requirements.join(', ') || 'None'}`,
      '',
      '── SELECTED SKILL ──',
      `Framework: ${report.selected_skill} (${report.skill_full_name})`,
      `Reason: ${report.skill_reason}`,
      '',
      '── MANUAL WORKFLOW (Simulated) ──',
      `Questions Required: ${report.num_questions}`,
      report.generated_questions.map((q, i) => `  Q${i+1}: ${q}`).join('\n'),
      `1) Prompt Text Tokens: ${report.raw_prompt_tokens}`,
      `2) Decision Making Tokens: ${report.decision_making_tokens}`,
      `3) Question Generation Tokens: ${report.estimated_question_tokens}`,
      `4) Analyze User Answers Tokens: ${report.estimated_answer_analysis_tokens}`,
      `5) Execute User Answers Tokens: ${report.estimated_execution_tokens}`,
      `+ Simulated User Answers Tokens: ${report.estimated_answer_tokens}`,
      `Total Manual Tokens: ${report.total_estimated_manual_tokens}`,
      `Manual Cost: $${report.estimated_manual_cost.toFixed(6)}`,
      '',
      '── OPTIMIZER WORKFLOW ──',
      `Raw Prompt Tokens: ${report.raw_prompt_tokens_opt}`,
      `Prompt Analysis Tokens: ${report.decision_making_tokens_opt}`,
      `Skill Selection Tokens: ${report.skill_selection_tokens}`,
      `Prompt Optimization Tokens: ${report.optimization_tokens}`,
      `Estimated Execution Tokens: ${report.estimated_optimizer_execution_tokens}`,
      `Total Estimated Optimizer Tokens: ${report.total_optimizer_tokens}`,
      `Optimizer Cost: $${report.estimated_optimizer_cost.toFixed(6)}`,
      '',
      '── COMPARISON ──',
      `Manual Tokens: ${report.manual_tokens}`,
      `Optimizer Tokens: ${report.optimizer_tokens_total}`,
      `Tokens Saved: ${report.tokens_saved}`,
      `Reduction: ${report.percentage_reduction.toFixed(1)}%`,
      `Cost Saved: $${report.estimated_cost_saved.toFixed(6)}`,
      '',
      '═══════════════════════════════════════',
    ].join('\n');
  }, [report]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(reportText); }
    catch { /* silently fail */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reportText]);

  const promptPreview = report.optimized_prompt.length > 300
    ? report.optimized_prompt.slice(0, 300) + '…'
    : report.optimized_prompt;

  return (
    <section id="final-report" className="animate-slide-up">
      <div className="glass-strong rounded-2xl border border-white/8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/15 to-cyan-500/10 p-5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <ScrollText size={16} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Final Optimization Report</h2>
              <p className="text-sm text-slate-500">Phase 11 — Comprehensive summary</p>
            </div>
          </div>
          <button
            id="copy-final-report"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              copied
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-indigo-500/15 hover:border-indigo-500/25 hover:text-indigo-300'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Report'}
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Optimized prompt */}
          <div>
            <SectionTitle>Optimized Prompt</SectionTitle>
            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
              <div className={`p-4 ${!showFullPrompt ? 'max-h-56 overflow-hidden' : ''}`}>
                <pre className="optimized-prompt-text text-sm">
                  {showFullPrompt ? report.optimized_prompt : promptPreview}
                </pre>
              </div>
              {report.optimized_prompt.length > 300 && (
                <button
                  onClick={() => setShowFullPrompt(p => !p)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-300 hover:text-indigo-300 border-t border-white/5 transition-colors"
                >
                  {showFullPrompt ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Show full prompt</>}
                </button>
              )}
            </div>
          </div>

          {/* Analysis */}
          <div>
            <SectionTitle>Prompt Analysis</SectionTitle>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Complexity</p>
                <Badge label={report.complexity} variant={complexityBadge(report.complexity)} size="sm" />
              </div>
              <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Ambiguity</p>
                <Badge label={report.ambiguity_level} variant={ambiguityBadge(report.ambiguity_level)} size="sm" />
              </div>
            </div>
            <div className="divide-y divide-white/5">
              <DataRow label="Quality Score" value={`${report.quality_score}/10`} />
              <DataRow label="Completeness" value={`${report.completeness_score}%`} />
              <DataRow label="Intent" value={report.intent} />
              <DataRow label="Prompt Type" value={report.prompt_type} />
              {report.missing_requirements.length > 0 && (
                <div className="py-2.5">
                  <p className="text-sm text-slate-400 mb-2">Missing Requirements</p>
                  <ul className="space-y-1.5">
                    {report.missing_requirements.map((r, i) => (
                      <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Skill */}
          <div>
            <SectionTitle>Selected Skill</SectionTitle>
            <div className="divide-y divide-white/5">
              <DataRow label="Framework" value={`${report.selected_skill} — ${report.skill_full_name}`} />
              <DataRow label="Reason" value={report.skill_reason} />
            </div>
          </div>

          {/* Manual workflow */}
          <div>
            <SectionTitle>Manual Workflow (Simulated)</SectionTitle>
            <div className="divide-y divide-white/5">
              <DataRow label="Questions Required" value={report.num_questions} estimated />
              <DataRow label="1) Prompt Text Tokens" value={report.raw_prompt_tokens} />
              <DataRow label="2) Decision Making Tokens" value={report.decision_making_tokens} />
              <DataRow label="3) Question Generation Tokens" value={report.estimated_question_tokens} estimated />
              <DataRow label="4) Analyze User Answers Tokens" value={report.estimated_answer_analysis_tokens} />
              <DataRow label="5) Execute User Answers Tokens" value={report.estimated_execution_tokens} />
              <DataRow label="+ Estimated Answer Tokens (simulated)" value={report.estimated_answer_tokens} estimated />
              <DataRow label="Total Manual Tokens" value={report.total_estimated_manual_tokens} />
              <DataRow label="Estimated Manual Cost" value={`$${report.estimated_manual_cost.toFixed(6)}`} mono />
            </div>
            {report.generated_questions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {report.generated_questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 py-1.5 font-sans">
                    <span className="text-cyan-400 font-bold shrink-0">Q{i + 1}.</span>
                    {q}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optimizer workflow */}
          <div>
            <SectionTitle>Optimizer Workflow</SectionTitle>
            <div className="divide-y divide-white/5">
              <DataRow label="Raw Prompt Tokens" value={report.raw_prompt_tokens_opt} />
              <DataRow label="Prompt Analysis Tokens" value={report.decision_making_tokens_opt} />
              <DataRow label="Skill Selection Tokens" value={report.skill_selection_tokens} />
              <DataRow label="Prompt Optimization Tokens" value={report.optimization_tokens} />
              <DataRow label="Estimated Execution Tokens" value={report.estimated_optimizer_execution_tokens} estimated />
              <DataRow label="Total Estimated Optimizer Tokens" value={report.total_optimizer_tokens} />
              <DataRow label="Estimated Optimizer Cost" value={`$${report.estimated_optimizer_cost.toFixed(6)}`} mono />
            </div>
          </div>

          {/* Comparison */}
          <div>
            <SectionTitle>Comparison</SectionTitle>
            <div className="divide-y divide-white/5">
              <DataRow label="Manual Tokens" value={report.manual_tokens} />
              <DataRow label="Optimizer Tokens" value={report.optimizer_tokens_total} />
              <DataRow label="Tokens Saved" value={report.tokens_saved} />
              <DataRow label="Reduction" value={`${report.percentage_reduction.toFixed(1)}%`} />
              <DataRow label="Estimated Cost Saved" value={`$${report.estimated_cost_saved.toFixed(6)}`} mono />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
