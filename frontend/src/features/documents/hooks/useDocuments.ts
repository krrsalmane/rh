import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../api';
import type { DocumentFilters, GenerateDocumentDto } from '../types';

// ============ Documents Hooks ============
export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => api.fetchDocuments(filters),
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.fetchDocument(id!),
    enabled: !!id,
  });
}

export function useGenerateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateDocumentDto) => api.generateDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document généré avec succès');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}

export function useArchiveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.archiveDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document archivé');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'archivage');
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
}
