export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assigneeName?: string;
  creatorName?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  assignedTo?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
}

export interface TaskFilters {
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}
