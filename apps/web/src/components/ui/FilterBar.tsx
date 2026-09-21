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
          'p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs space-y-3',
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
