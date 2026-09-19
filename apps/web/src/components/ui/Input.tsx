import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#1A1A1A]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            'flex h-10 w-full rounded-lg border border-[#D6E3F5] bg-white px-3.5 py-2 text-xs font-normal text-[#1A1A1A] placeholder:text-gray-400 transition-colors focus:border-[#3770E3] focus:outline-none focus:ring-2 focus:ring-[#3770E3]/15 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[#5871A5] font-normal">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
