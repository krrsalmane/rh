import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface FormFooterProps {
  onCancel: () => void;
  cancelText?: string;
  submitText?: string;
  submitType?: 'submit' | 'button';
  onSubmit?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
  className?: string;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onCancel,
  cancelText = 'Annuler',
  submitText = 'Enregistrer',
  submitType = 'submit',
  onSubmit,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  className,
}) => (
  <div className={cn('form-footer', className)}>
    <button type="button" className="btn-form-cancel" onClick={onCancel} disabled={isLoading}>
      {cancelText}
    </button>
    <button
      type={submitType}
      className={variant === 'danger' ? 'btn-form-danger' : 'btn-form-submit'}
      onClick={onSubmit}
      disabled={disabled || isLoading}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {submitText}
    </button>
  </div>
);
