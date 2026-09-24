import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  badge,
  actions,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCD8CE]',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#0F5E63]">{icon}</span>}
          <h3 className="font-serif text-base font-bold text-[#14213D] tracking-tight">{title}</h3>
          {badge && <div className="ml-1">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-[#4A5568] mt-0.5 max-w-2xl">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
