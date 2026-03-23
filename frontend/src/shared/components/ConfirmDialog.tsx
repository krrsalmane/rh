import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

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
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    confirmBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    confirmBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    confirmBg: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20',
  },
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${style.iconColor}`} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white ${style.confirmBg} rounded-xl transition-colors shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
