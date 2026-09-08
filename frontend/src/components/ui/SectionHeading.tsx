// src/components/ui/SectionHeading.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon: Icon, title, subtitle }) => (
  <div className="section-head">
    <div className="section-head-icon">
      <Icon size={16} />
    </div>
    <div>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  </div>
);