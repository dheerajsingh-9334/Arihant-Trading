import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
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

      {/* CoachAssist White Dialog Container */}
      <div
        className={twMerge(
          'relative w-full rounded-xl bg-white border border-[#D6E3F5] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-gray-900',
          maxWidths[maxWidth],
        )}
      >
        {/* Dialog Header */}
        <div className="px-5 py-4 border-b border-[#F0F5FC] bg-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-extrabold text-gray-950 tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#5871A5] font-normal mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7FBFF] text-gray-400 hover:text-[#223FA7] transition-colors border border-transparent hover:border-[#D6E3F5] shrink-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dialog Body with custom-scrollbar */}
        <div className="px-5 py-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
