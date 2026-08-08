// src/components/ui/Badge.tsx
import React from 'react';

type BadgeVariant = 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantMap: Record<BadgeVariant, string> = {
  indigo:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  cyan:    'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
  rose:    'bg-rose-500/15 text-rose-300 border-rose-500/25',
  slate:   'bg-slate-500/15 text-slate-300 border-slate-500/25',
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'slate', size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${variantMap[variant]}`}>
      {label}
    </span>
  );
};

export function complexityBadge(c: string): BadgeVariant {
  if (c === 'simple') return 'emerald';
  if (c === 'complex') return 'rose';
  return 'amber';
}

export function ambiguityBadge(a: string): BadgeVariant {
  if (a === 'low') return 'emerald';
  if (a === 'high') return 'rose';
  return 'amber';
}
