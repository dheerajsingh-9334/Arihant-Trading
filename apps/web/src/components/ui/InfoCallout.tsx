import React from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface InfoCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}

export const InfoCallout: React.FC<InfoCalloutProps> = ({
  variant = 'info',
  title,
  icon,
  onClose,
  children,
  className,
  ...props
}) => {
  const variantStyles = {
    info: 'bg-[#EAF2FF] border-[#D6E3F5] text-[#223FA7]',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    neutral: 'bg-[#F7FBFF] border-[#D6E3F5] text-[#1A1A1A]',
  }[variant];

  const closeButtonColors = {
    info: 'text-[#223FA7] hover:bg-[#DCE8FC]',
    warning: 'text-amber-800 hover:bg-amber-100',
    danger: 'text-red-800 hover:bg-red-100',
    success: 'text-emerald-800 hover:bg-emerald-100',
    neutral: 'text-[#5871A5] hover:bg-[#EEF5FF]',
  }[variant];

  const defaultIcons = {
    info: <Info className="h-4 w-4 shrink-0 text-[#223FA7]" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
    danger: <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />,
    success: <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />,
    neutral: <Info className="h-4 w-4 shrink-0 text-[#5871A5]" />,
  };

  const renderedIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <div
      className={twMerge(
        'p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 relative',
        variantStyles,
        className,
      )}
      {...props}
    >
      {renderedIcon}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold mb-0.5">{title}</h5>}
        <div className="space-y-1">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className={twMerge(
            'p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer',
            closeButtonColors,
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
