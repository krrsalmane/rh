import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { EmployeeCard } from '../components/EmployeeCard';
import { EmployeeDigitalFile } from '../components/EmployeeDigitalFile';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { DeleteEmployeeConfirm } from '../components/DeleteEmployeeConfirm';
import type { CreateEmployeeDto } from '../types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const canManage = auth.role === 'super_admin' || auth.role === 'hr_agent';
  
  const { data, isLoading, error } = useEmployee(id);
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const employee = data?.data;

  const handleUpdateSubmit = (formData: CreateEmployeeDto) => {
    if (id) {
      updateMutation.mutate(
        { id, data: formData },
        { onSuccess: () => setIsEditOpen(false) }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Employé introuvable</h2>
        <p className="text-sm text-slate-400 mb-4">L'employé demandé n'existe pas ou a été supprimé.</p>
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" id="employee-detail-page">
      {/* Back button */}
      <button
        onClick={() => navigate('/employees')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors"
        id="employee-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux employés
      </button>

      {/* Employee Card */}
      <EmployeeCard
        employee={employee}
        onEdit={canManage ? () => setIsEditOpen(true) : undefined}
        onDelete={canManage ? () => setIsDeleteOpen(true) : undefined}
      />

      {/* Digital File Tabs */}
      <EmployeeDigitalFile />

      {/* Edit Modal */}
      <EmployeeFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        employee={employee}
        onSubmit={handleUpdateSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirm */}
      <DeleteEmployeeConfirm
        isOpen={isDeleteOpen}
        employee={employee}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
