// src/components/sections/RawPromptSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { fmt } from '../../utils/format';

interface RawPromptSectionProps {
  prompt: string;
  tokens: number;
}

export const RawPromptSection: React.FC<RawPromptSectionProps> = ({ prompt, tokens }) => (
  <section id="raw-prompt" className="section-card animate-slide-up">
    <div className="section-head">
      <div className="section-head-icon">
        <FileText size={16} />
      </div>
      <div>
        <h2>Original Prompt</h2>
        <p>Your raw input before optimization</p>
      </div>
      <span className="ml-auto badge text-[#9AA4B2] border-[#232A36] bg-[#161C26]">
        <span className="font-mono metric-number">{fmt(tokens)}</span> tokens
      </span>
    </div>
    <div className="surface-subtle p-4">
      <p className="text-sm text-[#C6CDD9] leading-relaxed whitespace-pre-wrap">{prompt}</p>
    </div>
  </section>
);