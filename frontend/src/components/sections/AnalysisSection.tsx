// src/components/sections/AnalysisSection.tsx
import React from 'react';
import { Brain, Target, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '../../types/optimizer';
import { Badge, complexityBadge, ambiguityBadge, scoreTone } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { SectionHeading } from '../ui/SectionHeading';
import { TokenChip } from '../ui/TokenChip';
import { fmt } from '../../utils/format';

interface AnalysisSectionProps {
  analysis: AnalysisResult;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysis }) => (
  <section id="analysis" className="section-card animate-slide-up">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <SectionHeading
        icon={Brain}
        title="Prompt Analysis"
        subtitle="Phase 3 — Deep analysis via LLM"
      />
      <TokenChip count={analysis.tokens_used} label="analysis tokens consumed" kind="compute" />
    </div>

    <div className="surface-subtle p-3.5 mb-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Target size={13} className="text-[#7BA2FF]" />
        <span className="text-[0.72rem] font-semibold text-[#8FB0FF] uppercase tracking-wider">Intent</span>
      </div>
      <p className="text-sm text-[#C6CDD9] leading-relaxed">{analysis.intent}</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
      <div className="surface-subtle p-3">
        <p className="text-xs text-[#6B7686] mb-1.5">Prompt Type</p>
        <Badge label={analysis.prompt_type} tone="accent" />
      </div>
      <div className="surface-subtle p-3">
        <p className="text-xs text-[#6B7686] mb-1.5">Complexity</p>
        <Badge label={analysis.complexity} tone={complexityBadge(analysis.complexity)} />
      </div>
      <div className="surface-subtle p-3">
        <p className="text-xs text-[#6B7686] mb-1.5">Ambiguity</p>
        <Badge label={analysis.ambiguity_level} tone={ambiguityBadge(analysis.ambiguity_level)} />
      </div>
    </div>

    <div className="grid sm:grid-cols-2 gap-6 mb-5">
      <ProgressBar
        value={analysis.quality_score}
        max={10}
        label="Quality Score"
        tone={scoreTone(analysis.quality_score, 4, 7)}
        suffix="/10"
      />
      <ProgressBar
        value={analysis.completeness_score}
        max={100}
        label="Completeness"
        tone={scoreTone(analysis.completeness_score, 40, 70)}
      />
    </div>

    {analysis.missing_information.length > 0 && (
      <div className="surface-subtle p-3.5 border-[#E0A93B]/25">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertTriangle size={13} className="text-[#E8C079]" />
          <span className="text-[0.72rem] font-semibold text-[#E8C079] uppercase tracking-wider">
            Missing Information ({fmt(analysis.missing_information.length)})
          </span>
        </div>
        <ul className="space-y-1.5">
          {analysis.missing_information.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[0.85rem] text-[#9AA4B2]">
              <span className="w-1 h-1 rounded-full bg-[#E0A93B] mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
);