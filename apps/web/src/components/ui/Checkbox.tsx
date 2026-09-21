import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  description?: string;
  size?: 'sm' | 'md';
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, size = 'md', disabled, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeCls = {
      sm: 'h-3.5 w-3.5 rounded',
      md: 'h-4 w-4 rounded-md',
    }[size];

    return (
      <label
        htmlFor={inputId}
        className={twMerge(
          'inline-flex items-start gap-2 select-none cursor-pointer text-left',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          disabled={disabled}
          className={twMerge(
            'mt-0.5 border border-[#D6E3F5] text-[#223FA7] bg-white transition-colors focus:ring-2 focus:ring-[#223FA7]/20 focus:border-[#223FA7] cursor-pointer shrink-0',
            sizeCls,
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-[#5871A5] font-normal mt-0.5 leading-relaxed">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
