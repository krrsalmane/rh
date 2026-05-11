import * as tasksRepository from './tasks.repository';
import { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from './tasks.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getTasks(filters: TaskFiltersInput, user: any) {
  const { companyId, role, id } = user;
  
  if (role === 'employee') {
    filters.assignedTo = id;
  } else if (role === 'manager') {
    filters.managerId = id;
  }
  
  return tasksRepository.findAll(filters, companyId);
}

export async function getTaskById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const task = await tasksRepository.findById(id, companyId);
  
  if (!task) throw new AppError('Task not found', 404);
  
  // Basic isolation: employees can only see tasks assigned to them
  if (role === 'employee' && task.assigned_to !== userId) {
    throw new AppError('Access denied', 403);
  }
  
  return task;
}

export async function createTask(input: CreateTaskInput, user: any) {
  const { companyId, id: userId } = user;
  const task = await tasksRepository.create(input, companyId, userId);
  
  await auditLog({
    userId,
    companyId,
    action: 'CREATE',
    entity: 'task',
    entityId: task.id,
    newValue: input as unknown as Record<string, unknown>,
  });
  
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput, user: any) {
  const { companyId, id: userId, role } = user;
  const existing = await tasksRepository.findById(id, companyId);
  
  if (!existing) throw new AppError('Task not found', 404);
  
  // Employees can only update status of their own tasks
  if (role === 'employee') {
    if (existing.assigned_to !== userId) throw new AppError('Access denied', 403);
    // Only allow status update
    const allowedInput = { status: input.status };
    const updated = await tasksRepository.update(id, allowedInput, companyId);
    return updated;
  }

  const updated = await tasksRepository.update(id, input, companyId);
  
  await auditLog({
    userId,
    companyId,
    action: 'UPDATE',
    entity: 'task',
    entityId: id,
    oldValue: existing as unknown as Record<string, unknown>,
    newValue: input as unknown as Record<string, unknown>,
  });
  
  return updated;
}

export async function deleteTask(id: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await tasksRepository.findById(id, companyId);
  
  if (!existing) throw new AppError('Task not found', 404);
  
  await tasksRepository.remove(id, companyId);
  
  await auditLog({
    userId,
    companyId,
    action: 'DELETE',
    entity: 'task',
    entityId: id,
    oldValue: existing as unknown as Record<string, unknown>,
  });
}
