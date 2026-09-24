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
      primary: 'border-t-[3px] border-t-[#0F5E63]',
      blue: 'border-t-[3px] border-t-[#0F5E63]',
      emerald: 'border-t-[3px] border-t-emerald-600',
      amber: 'border-t-[3px] border-t-[#9A3412]',
      red: 'border-t-[3px] border-t-[#881337]',
      purple: 'border-t-[3px] border-t-[#14213D]',
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
      default: 'bg-white border-[#DCD8CE] text-[#14213D]',
      interactive: 'bg-white border-[#DCD8CE] text-[#14213D] hover:border-[#0F5E63] cursor-pointer active:scale-[0.995]',
      flat: 'bg-[#FBFAF7] border-[#DCD8CE] text-[#14213D]',
      dark: 'bg-[#14213D] border-[#14213D] text-white',
      leading: 'bg-[#E3EFEE] border-2 border-[#0F5E63] text-[#0B4A4E]',
      trailing: 'bg-[#FBEBDD] border-2 border-[#9A3412] text-[#7C2D12]',
      flush: 'p-0 overflow-hidden gap-0 bg-white border-[#DCD8CE] text-[#14213D]',
    }[variant];

    const bgCls = {
      white: 'bg-white',
      canvas: 'bg-[#F6F5F1]',
      muted: 'bg-[#FBFAF7]',
      dark: 'bg-[#14213D] text-white',
    }[bg];

    const isInteractive = variant === 'interactive' || hover;

    return (
      <div
        ref={ref}
        className={twMerge(
          'rounded-[14px] border border-[#DCD8CE] text-[#14213D] shadow-2xs transition-all duration-150 overflow-hidden relative',
          variantCls,
          bg !== 'white' && bgCls,
          isInteractive && variant !== 'interactive' && 'hover:border-[#0F5E63] hover:shadow-xs',
          selected && 'border-[#0F5E63] ring-1 ring-[#0F5E63]/20 bg-[#E3EFEE]/40',
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
      'flex items-center justify-between px-5 py-4 border-b border-[#ECE9E2] bg-white shrink-0 gap-3',
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
      'font-bold text-[15px] tracking-tight text-[#14213D] flex items-center gap-2',
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
    className={twMerge('text-xs text-[#4A5568] font-normal mt-0.5 leading-relaxed', className)}
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
      'flex items-center px-5 py-3 border-t border-[#ECE9E2] bg-[#FBFAF7] text-xs text-[#4A5568]',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
