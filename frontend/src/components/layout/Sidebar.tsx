// src/components/layout/Sidebar.tsx
import React from 'react';
import {
  FileText, GitCompare, Brain, MessageSquare, Layers, Wand2,
  Users, Bot, BarChart2, DollarSign, ArrowLeftRight, ScrollText
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'raw-prompt',        label: 'Raw Prompt',         icon: FileText },
  { id: 'prompt-diff',       label: 'Prompt Diff',         icon: GitCompare },
  { id: 'analysis',          label: 'Analysis',            icon: Brain },
  { id: 'clarification',     label: 'Clarification',       icon: MessageSquare },
  { id: 'skill',             label: 'Selected Skill',      icon: Layers },
  { id: 'optimized-prompt',  label: 'Optimized Prompt',   icon: Wand2 },
  { id: 'manual-workflow',   label: 'Manual Workflow',     icon: Users },
  { id: 'optimizer-workflow',label: 'Optimizer Workflow',  icon: Bot },
  { id: 'token-analytics',   label: 'Token Analytics',     icon: BarChart2 },
  { id: 'cost-analysis',     label: 'Cost Analysis',       icon: DollarSign },
  { id: 'comparison',        label: 'Comparison',          icon: ArrowLeftRight },
  { id: 'final-report',      label: 'Final Report',        icon: ScrollText },
];

interface SidebarProps {
  activeSection: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="w-56 flex-shrink-0">
      <div className="sticky top-20 glass rounded-2xl p-2 border border-white/5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 py-2 mb-1">
          Step 2 — Results
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 text-xs font-medium
                  ${isActive
                    ? 'nav-item-active text-indigo-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <Icon size={13} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
