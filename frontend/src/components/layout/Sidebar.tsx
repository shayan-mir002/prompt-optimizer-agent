// src/components/layout/Sidebar.tsx
import React from 'react';
import { Wand2, ArrowLeftRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'optimized-prompt', label: 'Optimized Prompt', icon: Wand2 },
  { id: 'comparison',       label: 'Comparison',       icon: ArrowLeftRight },
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
      <div className="sticky top-20 surface p-2">
        <p className="text-[10px] font-semibold text-[#6B7686] uppercase tracking-widest px-3 py-2 mb-1">
          Step 2 — Results
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium border transition-colors
                  ${isActive
                    ? 'bg-[#4F7CFF]/10 text-[#8FB0FF] border border-[#4F7CFF]/25'
                    : 'text-[#9AA4B2] border border-transparent hover:text-[#C6CDD9] hover:bg-[#161C26]'
                  }`}
              >
                <Icon size={13} className={isActive ? 'text-[#7BA2FF]' : 'text-[#6B7686]'} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};