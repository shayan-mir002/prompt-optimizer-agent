// src/components/ui/MetricCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  accent?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
  estimated?: boolean;
  className?: string;
}

const accentConfig = {
  indigo:  { border: 'border-indigo-500/30',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  icon: 'text-indigo-400' },
  cyan:    { border: 'border-cyan-500/30',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    icon: 'text-cyan-400' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
  amber:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: 'text-amber-400' },
  rose:    { border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    text: 'text-rose-400',    icon: 'text-rose-400' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, subValue, icon: Icon, accent = 'indigo', estimated, className = '',
}) => {
  const cfg = accentConfig[accent];
  return (
    <div className={`glass section-card ${cfg.border} border animate-slide-up count-anim ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold metric-number ${cfg.text}`}>{value}</p>
          {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
          {estimated && (
            <span className="mt-2 inline-block tag-pill bg-amber-500/15 text-amber-400 border border-amber-500/20">
              Estimated
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${cfg.bg} flex-shrink-0`}>
            <Icon size={18} className={cfg.icon} />
          </div>
        )}
      </div>
    </div>
  );
};
