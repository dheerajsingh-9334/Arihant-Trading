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
    return <IconComponent className="h-6 w-6 text-[#0F5E63]" />;
  };

  return (
    <div
      className={twMerge(
        'p-8 lg:p-12 text-center bg-white border border-[#DCD8CE] rounded-[14px] shadow-2xs flex flex-col items-center justify-center space-y-3',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="h-12 w-12 rounded-[10px] bg-[#FBFAF7] border border-[#DCD8CE] flex items-center justify-center text-[#4A5568]">
          {renderIcon()}
        </div>
      )}

      <div>
        <h4 className="font-serif text-sm font-bold text-[#14213D]">{title}</h4>
        {description && (
          <p className="text-xs text-[#4A5568] mt-1 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
