import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { EmployeeFilters } from '../components/EmployeeFilters';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import type { EmployeeFilters as FiltersType, Employee, CreateEmployeeDto } from '../types';

export const EmployeesListPage: React.FC = () => {
  const userRole = useAppSelector((s) => s.auth.role);
  const canCreate = userRole === 'super_admin' || userRole === 'hr_agent';

  const [filters, setFilters] = useState<FiltersType>({ page: 1, limit: 20 });
  const { data, isLoading } = useEmployees(filters);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

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

  return (
    <div className="space-y-6 animate-fade-in-up" id="employees-list-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Employés</h1>

        {canCreate && (
          <button onClick={handleCreate} className="btn-primary" id="new-employee-btn">
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
        onDelete={(employee) => deleteMutation.mutate(employee.id)}
      />

      {/* Create/Edit Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={editingEmployee}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

    </div>
  );
};
