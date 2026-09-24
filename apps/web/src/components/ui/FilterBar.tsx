import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          'p-4 bg-white border border-[#DCD8CE] rounded-[14px] shadow-2xs space-y-3',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

FilterBar.displayName = 'FilterBar';
