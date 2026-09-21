import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  moduleBadge?: string;
  badge?: string;
  tagline?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  icon,
  moduleBadge,
  badge,
  tagline,
  actions,
  className,
  children,
  ...props
}) => {
  const displayDescription = description || subtitle;
  const displayBadge = moduleBadge || badge;
  return (
    <div
      className={twMerge(
        'flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D6E3F5] pb-5',
        className,
      )}
      {...props}
    >
      <div>
        {(displayBadge || tagline) && (
          <div className="flex items-center gap-2 mb-1">
            {displayBadge && (
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-[#EAF2FF] text-[#223FA7] border border-[#D6E3F5]">
                {displayBadge}
              </span>
            )}
            {tagline && (
              <span className="text-xs text-[#5871A5] font-mono">{tagline}</span>
            )}
          </div>
        )}

        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
          {icon && <span className="shrink-0 text-[#223FA7]">{icon}</span>}
          <span>{title}</span>
        </h1>

        {displayDescription && (
          <p className="text-xs lg:text-sm text-[#5871A5] mt-1 max-w-2xl leading-relaxed">
            {displayDescription}
          </p>
        )}

        {children}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
