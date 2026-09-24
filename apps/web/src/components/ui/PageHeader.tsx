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
        'flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DCD8CE] pb-5',
        className,
      )}
      {...props}
    >
      <div>
        {(displayBadge || tagline) && (
          <div className="flex items-center gap-2 mb-1.5">
            {displayBadge && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#E3EFEE] text-[#0F5E63] border border-[#0F5E63]/30">
                {displayBadge}
              </span>
            )}
            {tagline && (
              <span className="text-xs text-[#4A5568] font-medium">{tagline}</span>
            )}
          </div>
        )}

        <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#14213D] flex items-center gap-2.5">
          {icon && <span className="shrink-0 text-[#0F5E63]">{icon}</span>}
          <span>{title}</span>
        </h1>

        {displayDescription && (
          <p className="text-xs lg:text-sm text-[#4A5568] mt-1.5 max-w-2xl leading-relaxed">
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
