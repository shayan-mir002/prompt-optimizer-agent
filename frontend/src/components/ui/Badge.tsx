// src/components/ui/Badge.tsx
import React from 'react';

export type BadgeTone = 'accent' | 'emerald' | 'amber' | 'rose' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

const toneMap: Record<BadgeTone, string> = {
  accent:  'text-[#8FB0FF] border-[#4F7CFF]/30 bg-[#4F7CFF]/10',
  emerald: 'text-[#59C99A] border-[#2FB67B]/30 bg-[#2FB67B]/10',
  amber:   'text-[#E8C079] border-[#E0A93B]/30 bg-[#E0A93B]/10',
  rose:    'text-[#F09AA8] border-[#E5677E]/30 bg-[#E5677E]/10',
  neutral: 'text-[#9AA4B2] border-[#232A36] bg-[#161C26]',
};

const dotMap: Record<BadgeTone, string> = {
  accent:  'bg-[#4F7CFF]',
  emerald: 'bg-[#2FB67B]',
  amber:   'bg-[#E0A93B]',
  rose:    'bg-[#E5677E]',
  neutral: 'bg-[#6B7686]',
};

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral', dot = true }) => (
  <span className={`badge ${toneMap[tone]}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[tone]}`} />}
    {label}
  </span>
);

export function complexityBadge(c: string): BadgeTone {
  if (c === 'simple') return 'emerald';
  if (c === 'complex') return 'rose';
  return 'amber';
}

export function ambiguityBadge(a: string): BadgeTone {
  if (a === 'low') return 'emerald';
  if (a === 'high') return 'rose';
  return 'amber';
}

export function scoreTone(score: number, low: number, high: number): BadgeTone {
  if (score >= high) return 'emerald';
  if (score >= low) return 'amber';
  return 'rose';
}