import axiosInstance from '@/shared/api/axiosInstance';
import type { Task, TaskFilters, CreateTaskDto, UpdateTaskDto } from './types';

function mapTask(raw: Record<string, unknown>): Task {
  return {
    id: raw.id as string,
    companyId: raw.company_id as string,
    title: raw.title as string,
    description: (raw.description as string) || null,
    assignedTo: (raw.assigned_to as string) || null,
    createdBy: (raw.created_by as string) || null,
    status: raw.status as any,
    priority: raw.priority as any,
    dueDate: (raw.due_date as string) || null,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
    assigneeName: raw.assignee_name as string,
    creatorName: raw.creator_name as string,
  };
}

export async function getTasks(filters: TaskFilters) {
  const { data } = await axiosInstance.get('/tasks', { params: filters });
  return {
    data: (data.data as Record<string, unknown>[]).map(mapTask),
    pagination: data.pagination,
  };
}

export async function getTaskById(id: string) {
  const { data } = await axiosInstance.get(`/tasks/${id}`);
  return mapTask(data.data);
}

export async function createTask(dto: CreateTaskDto) {
  const { data } = await axiosInstance.post('/tasks', dto);
  return mapTask(data.data);
}

export async function updateTask(id: string, dto: UpdateTaskDto) {
  const { data } = await axiosInstance.put(`/tasks/${id}`, dto);
  return mapTask(data.data);
}

export async function deleteTask(id: string) {
  await axiosInstance.delete(`/tasks/${id}`);
}
