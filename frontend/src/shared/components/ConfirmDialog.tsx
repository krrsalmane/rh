import React from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/shared/components/forms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const variantStyles = {
  danger: { icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  success: { icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  info: { icon: Info, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
};

export const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info',
  isLoading = false,
}) => {
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn-form-cancel" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn-form-danger' : 'btn-form-submit'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 ${style.iconBg} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${style.iconColor}`} />
        </div>
        <p className="text-sm text-[#6B7280]">{message}</p>
      </div>
    </Modal>
  );
};
