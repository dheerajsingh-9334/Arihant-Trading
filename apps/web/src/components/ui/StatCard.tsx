import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  title?: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  valueColor?: 'default' | 'primary' | 'emerald' | 'amber' | 'rose';
  variant?: 'default' | 'primary' | 'emerald' | 'amber' | 'rose';
  progress?: number;
  progressColor?: 'primary' | 'emerald' | 'amber' | 'rose';
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  title,
  value,
  subtext,
  icon,
  valueColor,
  variant = 'default',
  progress,
  progressColor = 'primary',
  badge,
  className,
  ...props
}) => {
  const displayLabel = label || title || '';
  const effectiveColor = valueColor || variant;

  const valueColorCls = {
    default: 'text-[#1A1A1A]',
    primary: 'text-[#223FA7]',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-red-700',
  }[effectiveColor];

  const progressColorCls = {
    primary: 'bg-[#223FA7]',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-red-500',
  }[progressColor];

  return (
    <div
      className={twMerge(
        'p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs hover:border-[#9FC0F5] transition-all duration-150 flex flex-col justify-between relative overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5871A5] line-clamp-1">
          {displayLabel}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && (
            <span className="p-1.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-[#223FA7]">
              {icon}
            </span>
          )}
        </div>
      </div>

      <div>
        <div className={twMerge('text-2xl font-black tracking-tight', valueColorCls)}>
          {value}
        </div>

        {progress !== undefined && (
          <div className="w-full bg-[#EAF2FF] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={twMerge('h-full rounded-full transition-all duration-300', progressColorCls)}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        )}

        {subtext && (
          <span className="text-xs text-[#5871A5] mt-1.5 block font-medium">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4 | 5;
  cols?: 2 | 3 | 4 | 5;
  children: React.ReactNode;
}

export const StatGrid: React.FC<StatGridProps> = ({
  columns,
  cols = 4,
  children,
  className,
  ...props
}) => {
  const effectiveCols = (columns || cols) as 2 | 3 | 4 | 5;
  const colCls = {
    2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    4: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    5: 'grid grid-cols-2 md:grid-cols-5 gap-4',
  }[effectiveCols] || 'grid grid-cols-2 md:grid-cols-4 gap-4';

  return (
    <div className={twMerge(colCls, className)} {...props}>
      {children}
    </div>
  );
};
