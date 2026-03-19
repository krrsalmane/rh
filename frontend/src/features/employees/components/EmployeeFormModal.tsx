import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { EmployeeForm } from './EmployeeForm';
import type { Employee, CreateEmployeeDto } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSubmit: (data: CreateEmployeeDto) => void;
  isSubmitting: boolean;
}

export const EmployeeFormModal: React.FC<Props> = ({ isOpen, onClose, employee, onSubmit, isSubmitting }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up"
        id="employee-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">
            {employee ? `Modifier ${employee.firstName} ${employee.lastName}` : 'Nouvel employé'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            id="employee-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <EmployeeForm
            employee={employee}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
