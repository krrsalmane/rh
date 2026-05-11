import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as absencesApi from '../api';
import type { AbsenceFilters, CreateAbsenceDto } from '../types';

const ABSENCES_KEY = 'absences';
const ABSENCE_ANALYTICS_KEY = 'absence-analytics';

export function useAbsences(filters: AbsenceFilters) {
  return useQuery({
    queryKey: [ABSENCES_KEY, filters],
    queryFn: () => absencesApi.getAbsences(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAbsence(id: string | undefined) {
  return useQuery({
    queryKey: [ABSENCES_KEY, id],
    queryFn: () => absencesApi.getAbsenceById(id!),
    enabled: !!id,
  });
}

export function useCreateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAbsenceDto) => absencesApi.createAbsence(dto),
    onSuccess: () => {
      toast.success('Absence enregistrée');
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
      qc.invalidateQueries({ queryKey: [ABSENCE_ANALYTICS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement"),
  });
}

export function useJustifyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      absencesApi.justifyAbsence(id, formData),
    onSuccess: (_, variables) => {
      toast.success('Justificatif enregistré');
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY, variables.id] });
      qc.invalidateQueries({ queryKey: [ABSENCE_ANALYTICS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useMarkUnjustified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => absencesApi.markUnjustified(id),
    onSuccess: (_, id) => {
      toast.success('Absence marquée comme non justifiée');
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY, id] });
      qc.invalidateQueries({ queryKey: [ABSENCE_ANALYTICS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useDeleteAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => absencesApi.deleteAbsence(id),
    onSuccess: () => {
      toast.success('Absence supprimée');
      qc.invalidateQueries({ queryKey: [ABSENCES_KEY] });
      qc.invalidateQueries({ queryKey: [ABSENCE_ANALYTICS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useAbsenceAnalytics() {
  return useQuery({
    queryKey: [ABSENCE_ANALYTICS_KEY],
    queryFn: () => absencesApi.getAbsenceAnalytics(),
  });
}
