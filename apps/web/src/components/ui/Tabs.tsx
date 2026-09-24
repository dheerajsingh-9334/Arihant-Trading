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
      'flex items-center space-x-1 p-1 bg-[#ECE9E2] border border-[#DCD8CE] rounded-[10px] overflow-x-auto select-none',
    pills:
      'flex flex-wrap items-center gap-1.5 border-b border-[#DCD8CE] pb-2 select-none',
    underline:
      'flex items-center space-x-4 border-b border-[#DCD8CE] select-none overflow-x-auto',
  };

  const itemStyles = (isActive: boolean) => {
    if (variant === 'pills') {
      return isActive
        ? 'bg-[#0F5E63] text-white shadow-xs font-semibold rounded-[8px]'
        : 'text-[#4A5568] hover:text-[#14213D] hover:bg-[#E3EFEE] rounded-[8px] font-medium';
    }
    if (variant === 'underline') {
      return isActive
        ? 'border-b-2 border-[#14213D] text-[#14213D] font-bold rounded-none pb-2 -mb-[1px]'
        : 'text-[#4A5568] hover:text-[#14213D] rounded-none pb-2 -mb-[1px] font-medium border-b-2 border-transparent';
    }
    // segmented default
    return isActive
      ? 'bg-white text-[#14213D] shadow-xs border border-[#DCD8CE] font-semibold rounded-[8px]'
      : 'text-[#4A5568] hover:text-[#14213D] hover:bg-white/60 rounded-[8px] font-medium';
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
                    ? variant === 'pills'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E3EFEE] text-[#0F5E63]'
                    : 'bg-white/80 text-[#4A5568] border border-[#DCD8CE]/80',
                  tab.badgeVariant === 'urgent' && 'bg-[#9A3412] text-white font-bold',
                  tab.badgeVariant === 'warning' && 'bg-[#FBEBDD] text-[#7C2D12] font-bold',
                  tab.badgeVariant === 'success' && 'bg-[#E3EFEE] text-[#0F5E63] font-bold',
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
