import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TabItem {
  id: string;
  label: string;
  count?: number;
  badgeVariant?: 'default' | 'urgent' | 'warning' | 'info';
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={twMerge(
        'flex items-center space-x-1 p-1 bg-[#EEF5FF] border border-[#D6E3F5] rounded-xl overflow-x-auto',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={twMerge(
              'flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'bg-white text-[#223FA7] shadow-xs border border-[#D6E3F5] font-semibold'
                : 'text-[#5871A5] hover:text-[#1A1A1A] hover:bg-white/60',
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={twMerge(
                  'px-1.5 py-0.2 text-[10px] font-bold rounded-full',
                  isActive
                    ? 'bg-[#EAF2FF] text-[#223FA7]'
                    : 'bg-white text-[#5871A5]',
                  tab.badgeVariant === 'urgent' && 'bg-red-50 text-red-700 font-bold',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
