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
      'flex items-center space-x-1 p-1 bg-white border border-[#E3E7ED] rounded-[10px] overflow-x-auto select-none',
    pills:
      'flex flex-wrap items-center gap-1.5 border-b border-[#E3E7ED] pb-2 select-none',
    underline:
      'flex items-center space-x-4 border-b border-[#E3E7ED] select-none overflow-x-auto',
  };

  const itemStyles = (isActive: boolean) => {
    if (variant === 'pills') {
      return isActive
        ? 'bg-[#E9F6F2] text-[#132822] shadow-xs font-semibold rounded-[8px]'
        : 'text-[#5E6A7C] hover:text-[#132822] hover:bg-[#F1F7F5] rounded-[8px] font-medium';
    }
    if (variant === 'underline') {
      return isActive
        ? 'border-b-2 border-[#16917A] text-[#132822] font-semibold rounded-none pb-2 -mb-[1px]'
        : 'text-[#5E6A7C] hover:text-[#132822] rounded-none pb-2 -mb-[1px] font-medium border-b-2 border-transparent';
    }
    // segmented default
    return isActive
      ? 'bg-[#E9F6F2] text-[#132822] shadow-xs font-semibold rounded-[8px]'
      : 'text-[#5E6A7C] hover:text-[#132822] hover:bg-[#F1F7F5] rounded-[8px] font-medium';
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
                  'px-1.5 py-0.2 text-[10px] font-bold font-mono rounded-full transition-colors',
                  isActive
                    ? 'bg-white text-[#0F5E4E]'
                    : 'bg-[#EEF1F5] text-[#152235]',
                  tab.badgeVariant === 'urgent' && 'bg-[#FEF1EF] text-[#B42318] font-bold',
                  tab.badgeVariant === 'warning' && 'bg-[#FFF8EB] text-[#A15C07] font-bold',
                  tab.badgeVariant === 'success' && 'bg-[#EAF6F0] text-[#1F7A55] font-bold',
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
