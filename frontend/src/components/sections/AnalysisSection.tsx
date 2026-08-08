// src/components/sections/AnalysisSection.tsx
import React from 'react';
import { Brain, Target, Zap, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '../../types/optimizer';
import { Badge, complexityBadge, ambiguityBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

interface AnalysisSectionProps {
  analysis: AnalysisResult;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysis }) => (
  <section id="analysis" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-indigo-500/10">
        <Brain size={16} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Prompt Analysis</h2>
        <p className="text-xs text-slate-500">Phase 3 — Deep analysis via LLM · {analysis.tokens_used} tokens used</p>
      </div>
    </div>

    {/* Intent */}
    <div className="mb-4 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
      <div className="flex items-center gap-2 mb-1.5">
        <Target size={12} className="text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Intent</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{analysis.intent}</p>
    </div>

    {/* Metadata grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
      <div className="p-3 rounded-xl bg-white/3 border border-white/5">
        <p className="text-xs text-slate-500 mb-1.5">Prompt Type</p>
        <Badge label={analysis.prompt_type} variant="indigo" />
      </div>
      <div className="p-3 rounded-xl bg-white/3 border border-white/5">
        <p className="text-xs text-slate-500 mb-1.5">Complexity</p>
        <Badge label={analysis.complexity} variant={complexityBadge(analysis.complexity)} />
      </div>
      <div className="p-3 rounded-xl bg-white/3 border border-white/5">
        <p className="text-xs text-slate-500 mb-1.5">Ambiguity</p>
        <Badge label={analysis.ambiguity_level} variant={ambiguityBadge(analysis.ambiguity_level)} />
      </div>
    </div>

    {/* Scores */}
    <div className="space-y-3 mb-5">
      <ProgressBar
        value={analysis.quality_score}
        max={10}
        label="Quality Score"
        color={analysis.quality_score >= 7 ? 'emerald' : analysis.quality_score >= 4 ? 'amber' : 'rose'}
        showValue
      />
      <ProgressBar
        value={analysis.completeness_score}
        max={100}
        label="Completeness"
        color={analysis.completeness_score >= 70 ? 'emerald' : analysis.completeness_score >= 40 ? 'amber' : 'rose'}
        showValue
      />
    </div>

    {/* Missing information */}
    {analysis.missing_information.length > 0 && (
      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertTriangle size={12} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Missing Information</span>
        </div>
        <ul className="space-y-1.5">
          {analysis.missing_information.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
);
