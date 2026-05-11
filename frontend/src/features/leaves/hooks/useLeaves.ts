import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as leavesApi from '../api';
import type { LeaveFilters, CreateLeaveRequestDto, CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../types';

const LEAVES_KEY = 'leaves';
const LEAVE_TYPES_KEY = 'leave-types';
const BALANCES_KEY = 'leave-balances';

// ── Leave Requests ──

export function useLeaveRequests(filters: LeaveFilters) {
  return useQuery({
    queryKey: [LEAVES_KEY, filters],
    queryFn: () => leavesApi.getLeaveRequests(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveRequestDto) => leavesApi.createLeaveRequest(dto),
    onSuccess: () => {
      toast.success('Demande de congé créée');
      qc.invalidateQueries({ queryKey: [LEAVES_KEY] });
      qc.invalidateQueries({ queryKey: [BALANCES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur lors de la création'),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => leavesApi.approveLeaveRequest(id, note),
    onSuccess: () => {
      toast.success('Congé approuvé');
      qc.invalidateQueries({ queryKey: [LEAVES_KEY] });
      qc.invalidateQueries({ queryKey: [BALANCES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => leavesApi.rejectLeaveRequest(id, note),
    onSuccess: () => {
      toast.success('Congé refusé');
      qc.invalidateQueries({ queryKey: [LEAVES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leavesApi.cancelLeaveRequest(id),
    onSuccess: () => {
      toast.success('Congé annulé');
      qc.invalidateQueries({ queryKey: [LEAVES_KEY] });
      qc.invalidateQueries({ queryKey: [BALANCES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useLeaveBalances(employeeId: string | undefined, year?: number) {
  return useQuery({
    queryKey: [BALANCES_KEY, employeeId, year],
    queryFn: () => leavesApi.getBalances(employeeId!, year),
    enabled: !!employeeId,
  });
}

// ── Leave Types ──

export function useLeaveTypes() {
  return useQuery({
    queryKey: [LEAVE_TYPES_KEY],
    queryFn: () => leavesApi.getLeaveTypes(),
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveTypeDto) => leavesApi.createLeaveType(dto),
    onSuccess: () => {
      toast.success('Type de congé créé');
      qc.invalidateQueries({ queryKey: [LEAVE_TYPES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveTypeDto }) => leavesApi.updateLeaveType(id, data),
    onSuccess: () => {
      toast.success('Type de congé mis à jour');
      qc.invalidateQueries({ queryKey: [LEAVE_TYPES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leavesApi.deleteLeaveType(id),
    onSuccess: () => {
      toast.success('Type de congé supprimé');
      qc.invalidateQueries({ queryKey: [LEAVE_TYPES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}
