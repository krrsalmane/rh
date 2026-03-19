import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as employeesApi from '../api';
import type { EmployeeFilters, CreateEmployeeDto, UpdateEmployeeDto } from '../types';

const EMPLOYEES_KEY = 'employees';
const DEPARTMENTS_KEY = 'employee-departments';

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, filters],
    queryFn: () => employeesApi.getEmployees(filters),
    placeholderData: (prev) => prev,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, id],
    queryFn: () => employeesApi.getEmployeeById(id!),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeesApi.createEmployee(data),
    onSuccess: (res) => {
      toast.success('Employé créé avec succès');
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
      navigate(`/employees/${res.data.id}`);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: (_res, variables) => {
      toast.success('Employé mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => employeesApi.deleteEmployee(id),
    onSuccess: () => {
      toast.success('Employé supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
      navigate('/employees');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY],
    queryFn: () => employeesApi.getDepartments(),
  });
}
