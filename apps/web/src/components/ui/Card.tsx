import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'primary' | 'none';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  selected?: boolean;
  variant?: 'default' | 'interactive' | 'flat' | 'dark' | 'leading' | 'trailing' | 'flush';
  bg?: 'white' | 'canvas' | 'muted' | 'dark';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      accent = 'none',
      padding = 'none',
      hover = false,
      selected = false,
      variant = 'default',
      bg = 'white',
      children,
      ...props
    },
    ref,
  ) => {
    const accentCls = {
      primary: 'border-t-[3px] border-t-[#0F5E4E]',
      blue: 'border-t-[3px] border-t-[#0F5E4E]',
      emerald: 'border-t-[3px] border-t-[#1F7A55]',
      amber: 'border-t-[3px] border-t-[#A15C07]',
      red: 'border-t-[3px] border-t-[#B42318]',
      purple: 'border-t-[3px] border-t-[#16917A]',
      none: '',
    }[accent];

    const paddingCls = {
      none: '',
      xs: 'p-2.5',
      sm: 'p-3.5 sm:p-4',
      md: 'p-4 sm:p-5',
      lg: 'p-6 sm:p-7',
    }[padding];

    const variantCls = {
      default: 'bg-white border-[#E3E7ED] text-[#152235]',
      interactive: 'bg-white border-[#E3E7ED] text-[#152235] hover:border-[#16917A] cursor-pointer active:scale-[0.995]',
      flat: 'bg-[#F9FAFB] border-[#E3E7ED] text-[#152235]',
      dark: 'bg-[#0F5E4E] border-[#0F5E4E] text-white',
      leading: 'bg-[#E9F6F2] border-2 border-[#0F5E4E] text-[#0F5E4E]',
      trailing: 'bg-[#FEF1EF] border-2 border-[#B42318] text-[#B42318]',
      flush: 'p-0 overflow-hidden gap-0 bg-white border-[#E3E7ED] text-[#152235]',
    }[variant];

    const bgCls = {
      white: 'bg-white',
      canvas: 'bg-[#F7F8FA]',
      muted: 'bg-[#F9FAFB]',
      dark: 'bg-[#0F5E4E] text-white',
    }[bg];

    const isInteractive = variant === 'interactive' || hover;

    return (
      <div
        ref={ref}
        className={twMerge(
          'rounded-[10px] border border-[#E3E7ED] text-[#152235] shadow-2xs transition-all duration-150 overflow-hidden relative',
          variantCls,
          bg !== 'white' && bgCls,
          isInteractive && variant !== 'interactive' && 'hover:border-[#16917A] hover:shadow-xs',
          selected && 'border-[#16917A] ring-1 ring-[#16917A]/20 bg-[#E9F6F2]/40',
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
      'flex items-center justify-between px-5 py-4 border-b border-[#E3E7ED] bg-white shrink-0 gap-3',
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
      'font-bold text-[15px] tracking-tight text-[#152235] flex items-center gap-2',
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
    className={twMerge('text-xs text-[#5E6A7C] font-normal mt-0.5 leading-relaxed', className)}
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
      'flex items-center px-5 py-3 border-t border-[#E3E7ED] bg-[#F9FAFB] text-xs text-[#5E6A7C]',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
