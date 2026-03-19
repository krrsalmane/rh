import * as timeRepository from './time.repository';
import { CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getTimeEntries(filters: TimeEntryFiltersInput, companyId: string) {
  return timeRepository.findAll(filters, companyId);
}

export async function getTimeEntryById(id: string, companyId: string) {
  const entry = await timeRepository.findById(id, companyId);
  if (!entry) throw new AppError('Time entry not found', 404);
  return entry;
}

export async function createTimeEntry(input: CreateTimeEntryInput, companyId: string, userId: string) {
  const entry = await timeRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'time_entry', entityId: entry.id, newValue: input as unknown as Record<string, unknown> });
  return entry;
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput, companyId: string, userId: string) {
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  const updated = await timeRepository.update(id, input, companyId, userId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteTimeEntry(id: string, companyId: string, userId: string) {
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  await timeRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function getTimeSummary(employeeId: string, startDate: string, endDate: string, companyId: string) {
  return timeRepository.getSummary(employeeId, startDate, endDate, companyId);
}
