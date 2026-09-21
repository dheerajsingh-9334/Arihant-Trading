import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-[#1A1A1A]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={twMerge(
            'flex w-full rounded-lg border border-[#D6E3F5] bg-white px-3.5 py-2 text-xs font-normal text-[#1A1A1A] placeholder:text-gray-400 transition-colors focus:border-[#223FA7] focus:outline-none focus:ring-2 focus:ring-[#223FA7]/15 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
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

Textarea.displayName = 'Textarea';
