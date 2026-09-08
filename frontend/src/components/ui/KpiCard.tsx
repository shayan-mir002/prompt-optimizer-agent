// src/components/ui/KpiCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type KpiAccent = 'blue' | 'emerald' | 'amber' | 'rose' | 'zinc';
export type PitchTone = 'good' | 'bad' | 'neutral';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  pitch?: { text: string; tone: PitchTone };
  icon?: LucideIcon;
  accent?: KpiAccent;
  helper?: string;
}

export const pitchChip: Record<PitchTone, string> = {
  good:    'text-[#59C99A] bg-[#2FB67B]/10 border-[#2FB67B]/25',
  bad:     'text-[#F09AA8] bg-[#E5677E]/10 border-[#E5677E]/25',
  neutral: 'text-[#9AA4B2] bg-[#161C26] border-[#232A36]',
};

const accentTop: Record<KpiAccent, string> = {
  blue:    'linear-gradient(90deg,#4F7CFF,#7BA2FF)',
  emerald: 'linear-gradient(90deg,#1E9B64,#2FB67B)',
  amber:   'linear-gradient(90deg,#C7912E,#E0A93B)',
  rose:    'linear-gradient(90deg,#C54B63,#E5677E)',
  zinc:    'linear-gradient(90deg,#3A4659,#546179)',
};

const accentIcon: Record<KpiAccent, string> = {
  blue:    'text-[#7BA2FF] bg-[#4F7CFF]/10 border-[#4F7CFF]/25',
  emerald: 'text-[#59C99A] bg-[#2FB67B]/10 border-[#2FB67B]/25',
  amber:   'text-[#E8C079] bg-[#E0A93B]/10 border-[#E0A93B]/25',
  rose:    'text-[#F09AA8] bg-[#E5677E]/10 border-[#E5677E]/25',
  zinc:    'text-[#9AA4B2] bg-[#1A2029] border-[#232A36]',
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, pitch, icon: Icon, accent = 'zinc', helper,
}) => (
  <div className="surface relative overflow-hidden p-5 animate-slide-up">
    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentTop[accent] }} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="stat-label mb-2" title={helper}>{label}</p>
        <div className="stat-value-xl">{value}</div>
        {sub && <p className="text-xs text-[#6B7686] mt-1.5">{sub}</p>}
        {pitch && (
          <span className={`badge mt-3 ${pitchChip[pitch.tone]}`}>{pitch.text}</span>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg border flex-shrink-0 ${accentIcon[accent]}`}>
          <Icon size={16} />
        </div>
      )}
    </div>
  </div>
);