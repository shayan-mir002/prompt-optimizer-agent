// src/components/sections/SkillSection.tsx
import React from 'react';
import { Layers, CheckCircle } from 'lucide-react';
import type { SkillResult } from '../../types/optimizer';
import { Badge } from '../ui/Badge';

interface SkillSectionProps {
  skill: SkillResult;
}

export const SkillSection: React.FC<SkillSectionProps> = ({ skill }) => (
  <section id="skill" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-lg bg-emerald-500/10">
        <Layers size={16} className="text-emerald-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Selected Skill</h2>
        <p className="text-xs text-slate-500">Phase 5 — Auto-selected from 21 frameworks · {skill.tokens_used} tokens</p>
      </div>
    </div>

    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500/8 to-cyan-500/5 border border-emerald-500/20">
      {/* Skill header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black gradient-text">{skill.name}</span>
            <Badge label="Selected" variant="emerald" />
          </div>
          <p className="text-xs text-slate-400">{skill.full_name}</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/15">
          <CheckCircle size={20} className="text-emerald-400" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{skill.description}</p>

      {/* Selection reason */}
      <div className="p-3 rounded-xl bg-black/20 border border-white/5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Why This Framework</p>
        <p className="text-xs text-slate-300 leading-relaxed">{skill.reason}</p>
      </div>
    </div>
  </section>
);
