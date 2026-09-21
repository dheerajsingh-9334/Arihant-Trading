import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          'space-y-6 pb-12 animate-in fade-in duration-200 max-w-full',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

PageContainer.displayName = 'PageContainer';
