import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'danger' | 'success' | 'white' | 'accent';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      as: Component = 'h2',
      size,
      color = 'primary',
      weight,
      align = 'left',
      truncate = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Default size based on HTML element if not explicitly specified
    const defaultSizes = {
      h1: '3xl',
      h2: '2xl',
      h3: 'xl',
      h4: 'lg',
      h5: 'md',
      h6: 'sm',
    } as const;

    const effectiveSize = size || defaultSizes[Component] || 'xl';

    const sizes = {
      '3xl': 'text-2xl lg:text-3xl tracking-tight',
      '2xl': 'text-xl lg:text-2xl tracking-tight',
      xl: 'text-lg lg:text-xl tracking-tight',
      lg: 'text-base lg:text-lg tracking-tight',
      md: 'text-sm lg:text-[15px]',
      sm: 'text-xs lg:text-[13px]',
      xs: 'text-[11px] uppercase tracking-wider',
    };

    const colors = {
      primary: 'text-[#14213D]',
      secondary: 'text-[#3D4A5C]',
      muted: 'text-[#4A5568]',
      brand: 'text-[#0F5E63]',
      accent: 'text-[#9A3412]',
      danger: 'text-[#881337]',
      success: 'text-[#0F5E63]',
      white: 'text-white',
    };

    const weights = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    };

    const defaultWeight =
      effectiveSize === '3xl' || effectiveSize === '2xl'
        ? 'bold'
        : effectiveSize === 'xl' || effectiveSize === 'lg' || effectiveSize === 'md'
          ? 'semibold'
          : 'semibold';

    const effectiveWeight = weight ? weights[weight] : weights[defaultWeight];

    const aligns = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref}
        className={twMerge(
          clsx(
            'font-serif',
            sizes[effectiveSize],
            colors[color],
            effectiveWeight,
            aligns[align],
            truncate && 'truncate',
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
Heading.displayName = 'Heading';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'label' | 'small';
  size?: '2xs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
  color?:
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'brand'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning'
  | 'white';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  mono?: boolean;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = 'p',
      size = 'base',
      color = 'primary',
      weight = 'normal',
      align = 'left',
      truncate = false,
      mono = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const sizes = {
      '2xs': 'text-[10px] leading-tight',
      xs: 'text-[11px] leading-relaxed',
      sm: 'text-xs leading-relaxed',
      base: 'text-[13px] leading-relaxed',
      md: 'text-sm leading-relaxed',
      lg: 'text-base leading-relaxed',
      xl: 'text-lg leading-relaxed',
    };

    const colors = {
      primary: 'text-[#14213D]',
      secondary: 'text-[#3D4A5C]',
      muted: 'text-[#4A5568]',
      brand: 'text-[#0F5E63]',
      accent: 'text-[#9A3412]',
      danger: 'text-[#881337]',
      success: 'text-[#0F5E63]',
      warning: 'text-[#9A3412]',
      white: 'text-white',
    };

    const weights = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const aligns = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref as any}
        className={twMerge(
          clsx(
            sizes[size],
            colors[color],
            weights[weight],
            aligns[align],
            mono && 'font-mono',
            truncate && 'truncate',
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
Text.displayName = 'Text';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  size?: 'xs' | 'sm' | 'md';
  required?: boolean;
  subtext?: string;
}

export const Label: React.FC<LabelProps> = ({
  size = 'xs',
  required = false,
  subtext,
  className,
  children,
  ...props
}) => {
  const sizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <label
      className={twMerge(
        'block font-semibold text-[#14213D] select-none',
        sizes[size],
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-1">
        {children}
        {required && <span className="text-[#881337] font-bold">*</span>}
      </span>
      {subtext && (
        <span className="block text-[11px] font-normal text-[#4A5568] mt-0.5">
          {subtext}
        </span>
      )}
    </label>
  );
};

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'xs' | 'sm';
}

export const Kbd: React.FC<KbdProps> = ({
  size = 'xs',
  className,
  children,
  ...props
}) => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
  };

  return (
    <kbd
      className={twMerge(
        'inline-flex items-center justify-center font-mono font-semibold rounded bg-[#FBFAF7] text-[#14213D] border border-[#DCD8CE] shadow-2xs select-none',
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
};
