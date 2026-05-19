import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as timeApi from '../api';
import type { TimeEntryFilters, CreateTimeEntryDto, UpdateTimeEntryDto, CreateWorkScheduleDto, TimeActionDto } from '../types';

const TIME_KEY = 'time-entries';
const TIME_SUMMARY_KEY = 'time-summary';
const SCHEDULES_KEY = 'work-schedules';

// ── Time Entries ──

export function useTimeEntries(filters: TimeEntryFilters) {
  return useQuery({
    queryKey: [TIME_KEY, filters],
    queryFn: () => timeApi.getTimeEntries(filters),
    placeholderData: (prev) => prev,
  });
}

export function useTimeSummary(filters: { employeeId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [TIME_SUMMARY_KEY, filters],
    queryFn: () => timeApi.getTimeSummary(filters),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTimeEntryDto) => timeApi.createTimeEntry(dto),
    onSuccess: () => {
      toast.success('Pointage enregistré');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useGenerateDefaultTimeEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => timeApi.generateDefaultTimeEntries(date),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Pointages générés avec succès');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur lors de la génération'),
  });
}

export function useUpdateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryDto }) =>
      timeApi.updateTimeEntry(id, data),
    onSuccess: (_, variables) => {
      toast.success('Pointage mis à jour');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_KEY, variables.id] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeApi.deleteTimeEntry(id),
    onSuccess: () => {
      toast.success('Pointage supprimé');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useExportTimeReport() {
  return useMutation({
    mutationFn: (filters: { employeeId?: string; startDate?: string; endDate?: string; format?: string }) =>
      timeApi.exportTimeReport(filters),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (time?: string) => timeApi.clockIn(time),
    onSuccess: () => {
      toast.success('Pointage d\'entrée enregistré');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (time?: string) => timeApi.clockOut(time),
    onSuccess: () => {
      toast.success('Pointage de sortie enregistré');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useRecordTimeAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: TimeActionDto) => timeApi.recordTimeAction(dto),
    onSuccess: () => {
      toast.success('Pointage enregistré');
      qc.invalidateQueries({ queryKey: [TIME_KEY] });
      qc.invalidateQueries({ queryKey: [TIME_SUMMARY_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

// ── Work Schedules ──

export function useWorkSchedules() {
  return useQuery({
    queryKey: [SCHEDULES_KEY],
    queryFn: () => timeApi.getWorkSchedules(),
  });
}

export function useCreateWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWorkScheduleDto) => timeApi.createWorkSchedule(dto),
    onSuccess: () => {
      toast.success('Horaire créé');
      qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useUpdateWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkScheduleDto> }) =>
      timeApi.updateWorkSchedule(id, data),
    onSuccess: () => {
      toast.success('Horaire mis à jour');
      qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useDeleteWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeApi.deleteWorkSchedule(id),
    onSuccess: () => {
      toast.success('Horaire supprimé');
      qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}
