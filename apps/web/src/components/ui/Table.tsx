import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto overflow-y-visible rounded-xl border border-[#D6E3F5] bg-white shadow-xs custom-scrollbar">
    <table
      ref={ref}
      className={twMerge('w-full caption-bottom text-xs text-left', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={twMerge(
      'bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] font-semibold text-[#5871A5] uppercase tracking-wider sticky top-0 z-10',
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={twMerge('divide-y divide-[#D6E3F5]/60 bg-white', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      'transition-colors hover:bg-[#F7FBFF] data-[state=selected]:bg-[#EAF2FF]',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={twMerge('h-10 px-4 text-left align-middle font-semibold text-[#5871A5]', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={twMerge('p-3.5 align-middle text-[#1A1A1A] text-xs', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
