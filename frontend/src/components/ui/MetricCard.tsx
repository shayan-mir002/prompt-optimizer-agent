// src/components/ui/MetricCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  icon?: LucideIcon;
  tone?: 'accent' | 'emerald' | 'amber' | 'rose' | 'neutral';
  helper?: string;
}

const toneConfig = {
  accent:  { icon: 'text-[#7BA2FF]',  bg: 'bg-[#4F7CFF]/10',  border: 'border-[#4F7CFF]/25' },
  emerald: { icon: 'text-[#59C99A]',  bg: 'bg-[#2FB67B]/10',  border: 'border-[#2FB67B]/25' },
  amber:   { icon: 'text-[#E8C079]',  bg: 'bg-[#E0A93B]/10',  border: 'border-[#E0A93B]/25' },
  rose:    { icon: 'text-[#F09AA8]',  bg: 'bg-[#E5677E]/10',  border: 'border-[#E5677E]/25' },
  neutral: { icon: 'text-[#9AA4B2]',  bg: 'bg-[#1A2029]',     border: 'border-[#232A36]' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, subValue, icon: Icon, tone = 'neutral', helper,
}) => {
  const cfg = toneConfig[tone];
  return (
    <div className={`surface p-4 animate-slide-up`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="stat-label mb-1.5" title={helper}>{label}</p>
          <p className={`stat-value ${cfg.icon}`}>{value}</p>
          {subValue && <p className="text-xs text-[#6B7686] mt-1">{subValue}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg border flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
            <Icon size={16} className={cfg.icon} />
          </div>
        )}
      </div>
    </div>
  );
};