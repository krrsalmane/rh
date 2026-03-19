import * as absencesRepository from './absences.repository';
import { CreateAbsenceInput, AbsenceFiltersInput } from './absences.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getAbsences(filters: AbsenceFiltersInput, companyId: string) {
  return absencesRepository.findAll(filters, companyId);
}

export async function getAbsenceById(id: string, companyId: string) {
  const absence = await absencesRepository.findById(id, companyId);
  if (!absence) throw new AppError('Absence not found', 404);
  return absence;
}

export async function createAbsence(input: CreateAbsenceInput, companyId: string, userId: string) {
  const absence = await absencesRepository.create(input, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'absence', entityId: absence.id, newValue: input as unknown as Record<string, unknown> });
  return absence;
}

export async function justifyAbsence(id: string, reviewNote: string, attachments: string[], companyId: string, userId: string) {
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  const updated = await absencesRepository.justify(id, reviewNote, attachments, userId, companyId);
  await auditLog({ userId, companyId, action: 'JUSTIFY', entity: 'absence', entityId: id, newValue: { justificationStatus: 'justified', reviewNote } });
  return updated;
}

export async function markUnjustified(id: string, reviewNote: string, companyId: string, userId: string) {
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  const updated = await absencesRepository.markUnjustified(id, reviewNote, userId, companyId);
  await auditLog({ userId, companyId, action: 'MARK_UNJUSTIFIED', entity: 'absence', entityId: id, newValue: { justificationStatus: 'unjustified', reviewNote } });
  return updated;
}

export async function deleteAbsence(id: string, companyId: string, userId: string) {
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  await absencesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'absence', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function getAnalytics(companyId: string, startDate: string, endDate: string) {
  return absencesRepository.getAnalytics(companyId, startDate, endDate);
}
