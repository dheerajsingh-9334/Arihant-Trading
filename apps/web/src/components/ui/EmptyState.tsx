import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | React.ComponentType<{ className?: string; size?: number | string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ className?: string; size?: number | string }>;
    return <IconComponent className="h-6 w-6 text-[#223FA7]" />;
  };

  return (
    <div
      className={twMerge(
        'p-8 lg:p-12 text-center bg-white border border-[#D6E3F5] rounded-xl shadow-2xs flex flex-col items-center justify-center space-y-3',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] flex items-center justify-center text-[#5871A5]">
          {renderIcon()}
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-[#1A1A1A]">{title}</h4>
        {description && (
          <p className="text-xs text-[#5871A5] mt-1 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
