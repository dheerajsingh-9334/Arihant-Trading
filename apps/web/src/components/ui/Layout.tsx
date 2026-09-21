import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export type SpacingScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const spacingMap: Record<SpacingScale, string> = {
  none: 'gap-0',
  xs: 'gap-1.5', // 6px
  sm: 'gap-2.5', // 10px
  md: 'gap-4',   // 16px
  lg: 'gap-6',   // 24px
  xl: 'gap-8',   // 32px
  '2xl': 'gap-12',// 48px
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  spacing?: SpacingScale;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = 'col',
      spacing = 'md',
      align,
      justify,
      wrap = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const directions = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    };

    const aligns = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const justifies = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          'flex',
          directions[direction],
          spacingMap[spacing],
          align && aligns[align],
          justify && justifies[justify],
          wrap && 'flex-wrap',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Stack.displayName = 'Stack';

export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  ({ align = 'center', spacing = 'sm', className, children, ...props }, ref) => (
    <Stack
      ref={ref}
      direction="row"
      align={align}
      spacing={spacing}
      className={className}
      {...props}
    >
      {children}
    </Stack>
  ),
);
HStack.displayName = 'HStack';

export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  ({ align = 'stretch', spacing = 'md', className, children, ...props }, ref) => (
    <Stack
      ref={ref}
      direction="col"
      align={align}
      spacing={spacing}
      className={className}
      {...props}
    >
      {children}
    </Stack>
  ),
);
VStack.displayName = 'VStack';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'full', padding = 'none', className, children, ...props }, ref) => {
    const maxSizes = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    };

    const paddings = {
      none: '',
      sm: 'px-3 py-2 sm:px-4 sm:py-3',
      md: 'px-4 py-4 sm:px-6 sm:py-6',
      lg: 'px-6 py-6 sm:px-8 sm:py-8',
    };

    return (
      <div
        ref={ref}
        className={twMerge('w-full mx-auto', maxSizes[size], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Container.displayName = 'Container';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto-fill' | 'auto-fit';
  gap?: SpacingScale;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 1, gap = 'md', className, children, ...props }, ref) => {
    const colMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
      12: 'grid-cols-12',
      'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]',
      'auto-fit': 'grid-cols-[repeat(auto-fit,minmax(240px,1fr))]',
    };

    return (
      <div
        ref={ref}
        className={twMerge('grid w-full', colMap[cols], spacingMap[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Grid.displayName = 'Grid';

export interface SpacerProps {
  size?: SpacingScale;
  axis?: 'vertical' | 'horizontal';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
  className,
}) => {
  const heights = {
    none: 'h-0',
    xs: 'h-1.5',
    sm: 'h-2.5',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
    '2xl': 'h-12',
  };

  const widths = {
    none: 'w-0',
    xs: 'w-1.5',
    sm: 'w-2.5',
    md: 'w-4',
    lg: 'w-6',
    xl: 'w-8',
    '2xl': 'w-12',
  };

  return (
    <div
      aria-hidden="true"
      className={twMerge(axis === 'vertical' ? heights[size] : widths[size], 'shrink-0', className)}
    />
  );
};

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: React.ReactNode;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className,
  ...props
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={twMerge('w-[1px] bg-[#D6E3F5] self-stretch mx-2 shrink-0', className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={twMerge('relative flex py-2 items-center w-full', className)} {...props}>
        <div className="grow border-t border-[#D6E3F5]" />
        <span className="shrink mx-3 text-[11px] font-semibold text-[#5871A5] uppercase tracking-wider">
          {label}
        </span>
        <div className="grow border-t border-[#D6E3F5]" />
      </div>
    );
  }

  return (
    <hr
      className={twMerge('w-full border-0 border-t border-[#D6E3F5] my-2', className)}
      {...props}
    />
  );
};
