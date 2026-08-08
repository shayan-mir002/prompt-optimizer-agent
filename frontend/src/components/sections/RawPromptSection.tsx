// src/components/sections/RawPromptSection.tsx
import React from 'react';
import { FileText, Hash } from 'lucide-react';

interface RawPromptSectionProps {
  prompt: string;
  tokens: number;
}

export const RawPromptSection: React.FC<RawPromptSectionProps> = ({ prompt, tokens }) => (
  <section id="raw-prompt" className="section-card glass border border-white/5 animate-slide-up">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-slate-500/10">
          <FileText size={16} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Raw Prompt</h2>
          <p className="text-xs text-slate-500">Your original input</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 border border-white/5">
        <Hash size={12} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300">{tokens} tokens</span>
      </div>
    </div>
    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{prompt}</p>
    </div>
  </section>
);
