import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'none';
    glow?: string;
  }
>(({ className, accent = 'none', children, glow, ...props }, ref) => {
  const accentCls = {
    blue: 'border-t-[3px] border-t-[#223FA7]',
    emerald: 'border-t-[3px] border-t-emerald-500',
    amber: 'border-t-[3px] border-t-amber-500',
    red: 'border-t-[3px] border-t-red-500',
    purple: 'border-t-[3px] border-t-purple-500',
    none: '',
  }[accent];

  return (
    <div
      ref={ref}
      className={twMerge(
        'rounded-xl border border-[#D6E3F5] bg-white text-gray-900 shadow-xs transition-all duration-200 overflow-hidden relative hover:shadow-md',
        accentCls,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(
      'flex flex-col space-y-1 px-5 py-4 border-b border-[#F0F5FC] bg-white shrink-0',
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={twMerge(
      'font-extrabold text-[15px] tracking-tight text-gray-950 flex items-center gap-2',
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={twMerge('text-xs text-[#5871A5] font-normal mt-0.5', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={twMerge('p-5', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(
      'flex items-center px-5 py-3 border-t border-[#F0F5FC] bg-gray-50/60',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
