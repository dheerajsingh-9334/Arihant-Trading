import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'none';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  selected?: boolean;
  variant?: 'default' | 'interactive' | 'flat';
  bg?: 'white' | 'canvas' | 'muted';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      accent = 'none',
      padding = 'none',
      hover = true,
      selected = false,
      variant = 'default',
      bg = 'white',
      children,
      ...props
    },
    ref,
  ) => {
    const accentCls = {
      blue: 'border-t-[3px] border-t-[#223FA7]',
      emerald: 'border-t-[3px] border-t-emerald-500',
      amber: 'border-t-[3px] border-t-amber-500',
      red: 'border-t-[3px] border-t-red-500',
      purple: 'border-t-[3px] border-t-purple-500',
      none: '',
    }[accent];

    const paddingCls = {
      none: '',
      xs: 'p-2.5',
      sm: 'p-3.5 sm:p-4',
      md: 'p-4 sm:p-5',
      lg: 'p-6 sm:p-7',
    }[padding];

    const bgCls = {
      white: 'bg-white',
      canvas: 'bg-[#F7FBFF]',
      muted: 'bg-[#EEF5FF]',
    }[bg];

    const isInteractive = variant === 'interactive' || hover;

    return (
      <div
        ref={ref}
        className={twMerge(
          'rounded-xl border border-[#D6E3F5] text-[#1A1A1A] shadow-2xs transition-all duration-150 overflow-hidden relative',
          bgCls,
          isInteractive && 'hover:border-[#9FC0F5] hover:shadow-xs',
          variant === 'interactive' && 'cursor-pointer active:scale-[0.995]',
          selected && 'border-[#223FA7] ring-1 ring-[#223FA7]/20 bg-[#EAF2FF]/30',
          accentCls,
          paddingCls,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(
      'flex items-center justify-between px-5 py-4 border-b border-[#F0F5FC] bg-white shrink-0 gap-3',
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={twMerge(
      'font-bold text-[15px] tracking-tight text-[#1A1A1A] flex items-center gap-2',
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
    className={twMerge('text-xs text-[#5871A5] font-normal mt-0.5 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge('flex items-center gap-2 shrink-0 ml-auto', className)}
    {...props}
  />
));
CardAction.displayName = 'CardAction';

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
      'flex items-center px-5 py-3 border-t border-[#F0F5FC] bg-[#F7FBFF]',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
