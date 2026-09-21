import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  badgeVariant?: 'default' | 'urgent' | 'warning' | 'info' | 'success';
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'segmented' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
  };

  const containerStyles = {
    segmented:
      'flex items-center space-x-1 p-1 bg-[#EEF5FF] border border-[#D6E3F5] rounded-xl overflow-x-auto select-none',
    pills:
      'flex flex-wrap items-center gap-1.5 border-b border-[#D6E3F5] pb-2 select-none',
    underline:
      'flex items-center space-x-4 border-b border-[#D6E3F5] select-none overflow-x-auto',
  };

  const itemStyles = (isActive: boolean) => {
    if (variant === 'pills') {
      return isActive
        ? 'bg-[#223FA7] text-white shadow-xs font-semibold rounded-lg'
        : 'text-[#5871A5] hover:text-[#1A1A1A] hover:bg-[#EAF2FF] rounded-lg font-medium';
    }
    if (variant === 'underline') {
      return isActive
        ? 'border-b-2 border-[#223FA7] text-[#223FA7] font-bold rounded-none pb-2 -mb-[1px]'
        : 'text-[#5871A5] hover:text-[#1A1A1A] rounded-none pb-2 -mb-[1px] font-medium border-b-2 border-transparent';
    }
    // segmented default
    return isActive
      ? 'bg-white text-[#223FA7] shadow-xs border border-[#D6E3F5] font-semibold rounded-lg'
      : 'text-[#5871A5] hover:text-[#1A1A1A] hover:bg-white/60 rounded-lg font-medium';
  };

  return (
    <div className={twMerge(containerStyles[variant], className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={twMerge(
              'flex items-center transition-all duration-150 whitespace-nowrap cursor-pointer',
              sizeStyles[size],
              itemStyles(isActive),
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={twMerge(
                  'px-1.5 py-0.2 text-[10px] font-bold rounded-full transition-colors',
                  isActive
                    ? variant === 'pills'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#EAF2FF] text-[#223FA7]'
                    : 'bg-white/80 text-[#5871A5] border border-[#D6E3F5]/60',
                  tab.badgeVariant === 'urgent' && 'bg-red-50 text-red-700 font-bold',
                  tab.badgeVariant === 'warning' && 'bg-amber-100 text-amber-800 font-bold',
                  tab.badgeVariant === 'success' && 'bg-emerald-100 text-emerald-800 font-bold',
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
