import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'danger'
    | 'warning'
    | 'success'
    | 'info'
    | 'outline'
    | 'urgent'
    | 'cyber';
  size?: 'sm' | 'md';
  hasDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'default',
  size = 'md',
  hasDot = false,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-md select-none border transition-colors text-[11px]';

  const variants = {
    default: 'bg-[#EEF5FF] text-[#5871A5] border-[#D6E3F5]',
    info: 'bg-[#EAF2FF] text-[#223FA7] border-[#D6E3F5] font-semibold',
    cyber: 'bg-[#EAF2FF] text-[#223FA7] border-[#D6E3F5] font-semibold',
    danger: 'bg-red-50 text-red-700 border-red-200 font-semibold',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    outline: 'bg-white text-gray-600 border-[#D6E3F5]',
    urgent: 'bg-red-50 text-red-700 border-red-300 font-bold animate-pulse',
  };

  const dotColors = {
    default: 'bg-[#5871A5]',
    danger: 'bg-red-600',
    warning: 'bg-amber-600',
    success: 'bg-emerald-600',
    info: 'bg-[#223FA7]',
    cyber: 'bg-[#223FA7]',
    outline: 'bg-gray-400',
    urgent: 'bg-red-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-[11px] gap-1.5',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {(hasDot || variant === 'urgent') && (
        <span
          className={twMerge(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColors[variant],
            variant === 'urgent' && 'animate-ping',
          )}
        />
      )}
      {children}
    </span>
  );
};
