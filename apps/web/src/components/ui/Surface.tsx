import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'span';
  bg?:
    | 'canvas'
    | 'card'
    | 'white'
    | 'muted'
    | 'secondary'
    | 'brand'
    | 'dangerSubtle'
    | 'successSubtle'
    | 'warningSubtle'
    | 'transparent';
  border?: 'default' | 'subtle' | 'brand' | 'danger' | 'warning' | 'success' | 'none';
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | '2xs' | 'xs' | 'sm' | 'md';
  hover?: boolean;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      as: Component = 'div',
      bg = 'card',
      border = 'default',
      rounded = 'xl',
      padding = 'none',
      shadow = 'none',
      hover = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const backgrounds = {
      canvas: 'bg-[#F7FBFF]',
      card: 'bg-white',
      white: 'bg-white',
      muted: 'bg-[#EEF5FF]',
      secondary: 'bg-[#EAF2FF]',
      brand: 'bg-[#223FA7] text-white',
      dangerSubtle: 'bg-red-50 text-red-900',
      successSubtle: 'bg-emerald-50 text-emerald-900',
      warningSubtle: 'bg-amber-50 text-amber-900',
      transparent: 'bg-transparent',
    };

    const borders = {
      default: 'border border-[#D6E3F5]',
      subtle: 'border border-[#F0F5FC]',
      brand: 'border border-[#223FA7]',
      danger: 'border border-red-200',
      warning: 'border border-amber-200',
      success: 'border border-emerald-200',
      none: 'border-0',
    };

    const roundeds = {
      none: 'rounded-none',
      xs: 'rounded',
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      '2xl': 'rounded-3xl',
      full: 'rounded-full',
    };

    const paddings = {
      none: '',
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10',
    };

    const shadows = {
      none: '',
      '2xs': 'shadow-2xs',
      xs: 'shadow-xs',
      sm: 'shadow-sm',
      md: 'shadow-md',
    };

    return (
      <Component
        ref={ref as any}
        className={twMerge(
          clsx(
            backgrounds[bg],
            borders[border],
            roundeds[rounded],
            paddings[padding],
            shadows[shadow],
            hover && 'transition-all duration-150 hover:border-[#9FC0F5] hover:shadow-xs',
            className,
          ),
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Surface.displayName = 'Surface';

export const Box = Surface;
