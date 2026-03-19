import * as leaveTypesRepository from './leaveTypes.repository';
import { CreateLeaveTypeInput, UpdateLeaveTypeInput } from './leaveTypes.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getLeaveTypes(companyId: string, page: number = 1, limit: number = 20) {
  return leaveTypesRepository.findAll(companyId, page, limit);
}

export async function getLeaveTypeById(id: string, companyId: string) {
  const lt = await leaveTypesRepository.findById(id, companyId);
  if (!lt) throw new AppError('Leave type not found', 404);
  return lt;
}

export async function createLeaveType(input: CreateLeaveTypeInput, companyId: string, userId: string) {
  const lt = await leaveTypesRepository.create(input, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'leave_type', entityId: lt.id, newValue: input as unknown as Record<string, unknown> });
  return lt;
}

export async function updateLeaveType(id: string, input: UpdateLeaveTypeInput, companyId: string, userId: string) {
  const existing = await leaveTypesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Leave type not found', 404);
  const updated = await leaveTypesRepository.update(id, input, companyId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'leave_type', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteLeaveType(id: string, companyId: string, userId: string) {
  const existing = await leaveTypesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Leave type not found', 404);
  await leaveTypesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'leave_type', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}
