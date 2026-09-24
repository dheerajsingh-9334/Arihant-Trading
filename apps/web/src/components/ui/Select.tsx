import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-[#14213D]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={twMerge(
            'flex h-10 w-full rounded-[8px] border border-[#C9C4B8] bg-white px-3.5 py-2 text-xs font-normal text-[#14213D] transition-colors focus:border-[#0F5E63] focus:outline-none focus:ring-2 focus:ring-[#0F5E63]/15 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[#881337] focus:border-[#881337] focus:ring-[#881337]/15',
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white text-[#14213D]"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs text-[#881337] font-medium">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
