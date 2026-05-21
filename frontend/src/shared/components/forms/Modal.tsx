import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type ModalSize = 'default' | 'large' | 'wide';

interface ModalProps {
  isOpen?: boolean; // prefer this, but accept `open` from older usages
  open?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  id?: string;
  /** Hide default header (e.g. custom preview chrome) */
  hideHeader?: boolean;
}

const sizeClass: Record<ModalSize, string> = {
  default: '',
  large: 'modal-box--large',
  wide: 'modal-box--wide',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  open: openProp,
  onClose,
  title,
  children,
  footer,
  size = 'default',
  id,
  hideHeader = false,
}) => {
  // Accept both `isOpen` and `open` props for compatibility
  const open = typeof isOpen !== 'undefined' ? isOpen : !!openProp;

  // Do not forcibly lock body scrolling — allow page scroll by default
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="modal-overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div className={cn('modal-box', sizeClass[size])} id={id}>
        {!hideHeader && (
          <div className="modal-header">
            <h2 className="modal-title" id={id ? `${id}-title` : undefined}>
              {title}
            </h2>
          </div>
        )}

        <button
          type="button"
          className="modal-close btn-icon"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className={cn(!hideHeader && 'modal-body')}>{children}</div>

        {footer && <div className="form-footer">{footer}</div>}
      </div>
    </div>
  );
};
