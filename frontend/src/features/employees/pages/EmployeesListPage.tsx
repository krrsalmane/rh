import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { EmployeeFilters } from '../components/EmployeeFilters';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { DeleteEmployeeConfirm } from '../components/DeleteEmployeeConfirm';
import type { EmployeeFilters as FiltersType, Employee, CreateEmployeeDto } from '../types';

export const EmployeesListPage: React.FC = () => {
  const userRole = useAppSelector((s) => s.auth.role);
  const canCreate = userRole === 'super_admin' || userRole === 'hr_agent';

  const [filters, setFilters] = useState<FiltersType>({ page: 1, limit: 20 });
  const { data, isLoading } = useEmployees(filters);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const handleCreate = () => {
    setEditingEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (formData: CreateEmployeeDto) => {
    if (editingEmployee) {
      updateMutation.mutate(
        { id: editingEmployee.id, data: formData },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingEmployee) {
      deleteMutation.mutate(deletingEmployee.id, {
        onSuccess: () => setDeletingEmployee(null),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="employees-list-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Employés</h1>
            {data?.pagination && (
              <p className="text-sm text-slate-400">{data.pagination.total} employé{data.pagination.total !== 1 ? 's' : ''} au total</p>
            )}
          </div>
        </div>

        {canCreate && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:-translate-y-0.5 active:translate-y-0"
            id="new-employee-btn"
          >
            <Plus className="w-4 h-4" />
            Nouvel employé
          </button>
        )}
      </div>

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={data?.pagination?.total}
      />

      {/* Table */}
      <EmployeeTable
        employees={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        filters={filters}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onDelete={setDeletingEmployee}
      />

      {/* Create/Edit Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={editingEmployee}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirm */}
      <DeleteEmployeeConfirm
        isOpen={!!deletingEmployee}
        employee={deletingEmployee}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEmployee(null)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
