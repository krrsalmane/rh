import * as publicHolidaysRepository from './publicHolidays.repository';
import { CreatePublicHolidayInput, UpdatePublicHolidayInput } from './publicHolidays.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getPublicHolidays(companyId: string, year?: number, page: number = 1, limit: number = 50) {
  return publicHolidaysRepository.findAll(companyId, year, page, limit);
}

export async function getPublicHolidayById(id: string, companyId: string) {
  const holiday = await publicHolidaysRepository.findById(id, companyId);
  if (!holiday) throw new AppError('Public holiday not found', 404);
  return holiday;
}

export async function createPublicHoliday(input: CreatePublicHolidayInput, companyId: string, userId: string) {
  const holiday = await publicHolidaysRepository.create(input, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'public_holiday', entityId: holiday.id, newValue: input as unknown as Record<string, unknown> });
  return holiday;
}

export async function updatePublicHoliday(id: string, input: UpdatePublicHolidayInput, companyId: string, userId: string) {
  const existing = await publicHolidaysRepository.findById(id, companyId);
  if (!existing) throw new AppError('Public holiday not found', 404);
  const updated = await publicHolidaysRepository.update(id, input, companyId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'public_holiday', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deletePublicHoliday(id: string, companyId: string, userId: string) {
  const existing = await publicHolidaysRepository.findById(id, companyId);
  if (!existing) throw new AppError('Public holiday not found', 404);
  await publicHolidaysRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'public_holiday', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}
