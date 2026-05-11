import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as tasksApi from '../api';
import type { TaskFilters, CreateTaskDto, UpdateTaskDto } from '../types';

const TASKS_KEY = 'tasks';

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: () => tasksApi.getTasks(filters),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: () => tasksApi.getTaskById(id!),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast.success('Tâche créée avec succès');
    },
    onError: () => toast.error('Erreur lors de la création de la tâche'),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, id] });
      toast.success('Tâche mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast.success('Tâche supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
