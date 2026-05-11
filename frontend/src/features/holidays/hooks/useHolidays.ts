import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as holidaysApi from '../api';
import type { CreatePublicHolidayDto, UpdatePublicHolidayDto } from '../types';

const HOLIDAYS_KEY = 'public-holidays';

export function usePublicHolidays(year?: number) {
  return useQuery({
    queryKey: [HOLIDAYS_KEY, year],
    queryFn: () => holidaysApi.getPublicHolidays(year),
  });
}

export function useCreatePublicHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePublicHolidayDto) => holidaysApi.createPublicHoliday(dto),
    onSuccess: () => {
      toast.success('Jour férié ajouté');
      qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useUpdatePublicHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePublicHolidayDto }) =>
      holidaysApi.updatePublicHoliday(id, data),
    onSuccess: () => {
      toast.success('Jour férié mis à jour');
      qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}

export function useDeletePublicHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysApi.deletePublicHoliday(id),
    onSuccess: () => {
      toast.success('Jour férié supprimé');
      qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  });
}
