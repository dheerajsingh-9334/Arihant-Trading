import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#3770E3]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] text-[13px] max-w-full min-w-0';

    const variants = {
      primary:
        'bg-[#223FA7] hover:bg-[#1B326F] text-white shadow-sm border border-transparent font-semibold',
      secondary:
        'bg-[#EAF2FF] hover:bg-[#DCE8FC] text-[#223FA7] border border-[#D6E3F5] font-semibold',
      outline:
        'border border-[#D6E3F5] bg-white text-gray-700 hover:bg-[#F7FBFF] hover:text-[#223FA7] hover:border-[#9FC0F5] shadow-xs',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold',
      ghost:
        'text-gray-600 hover:text-[#223FA7] hover:bg-[#EAF2FF]',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-xs gap-1.5',
      md: 'px-3.5 py-2 text-[13px] gap-2',
      lg: 'px-4.5 py-2.5 text-sm gap-2.5',
      icon: 'p-2 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(baseStyles, variants[variant], sizes[size], className),
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
