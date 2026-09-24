import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { IconButton } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Translucent overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Light Executive Modal Container */}
      <div
        className={twMerge(
          'relative w-full rounded-[14px] bg-white border border-[#DCD8CE] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-[#14213D]',
          maxWidths[maxWidth],
        )}
      >
        {/* Dialog Header */}
        <div className="px-5 py-4 border-b border-[#ECE9E2] bg-[#FBFAF7] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif text-[16px] font-bold text-[#14213D] tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#4A5568] font-normal mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={<X className="h-4 w-4" />}
            aria-label="Close modal"
            onClick={onClose}
            size="sm"
            variant="ghost"
          />
        </div>

        {/* Dialog Body with custom-scrollbar */}
        <div className="px-5 py-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
