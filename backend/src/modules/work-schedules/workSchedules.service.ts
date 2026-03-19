import * as workSchedulesRepository from './workSchedules.repository';
import { CreateWorkScheduleInput, UpdateWorkScheduleInput } from './workSchedules.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getWorkSchedules(companyId: string, page: number = 1, limit: number = 20) {
  return workSchedulesRepository.findAll(companyId, page, limit);
}

export async function getWorkScheduleById(id: string, companyId: string) {
  const schedule = await workSchedulesRepository.findById(id, companyId);
  if (!schedule) throw new AppError('Work schedule not found', 404);
  return schedule;
}

export async function createWorkSchedule(input: CreateWorkScheduleInput, companyId: string, userId: string) {
  const schedule = await workSchedulesRepository.create(input, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'work_schedule', entityId: schedule.id, newValue: input as unknown as Record<string, unknown> });
  return schedule;
}

export async function updateWorkSchedule(id: string, input: UpdateWorkScheduleInput, companyId: string, userId: string) {
  const existing = await workSchedulesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Work schedule not found', 404);
  const updated = await workSchedulesRepository.update(id, input, companyId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'work_schedule', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteWorkSchedule(id: string, companyId: string, userId: string) {
  const existing = await workSchedulesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Work schedule not found', 404);
  await workSchedulesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'work_schedule', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}
