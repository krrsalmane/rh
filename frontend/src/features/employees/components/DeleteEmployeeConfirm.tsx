import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Employee } from '../types';

interface Props {
  isOpen: boolean;
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteEmployeeConfirm: React.FC<Props> = ({ isOpen, employee, onConfirm, onCancel, isDeleting }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in-up" id="delete-employee-dialog">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Supprimer l'employé</h3>
          <p className="text-sm text-slate-500 mb-6">
            Êtes-vous sûr de vouloir supprimer <strong>{employee.firstName} {employee.lastName}</strong> ?
            Cette action est irréversible.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              id="delete-cancel-btn"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              id="delete-confirm-btn"
            >
              {isDeleting && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
