import * as leavesRepository from './leaves.repository';
import { CreateLeaveRequestInput, ReviewLeaveInput, LeaveFiltersInput } from './leaves.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getLeaveRequests(filters: LeaveFiltersInput, companyId: string) {
  return leavesRepository.findAll(filters, companyId);
}

export async function getLeaveRequestById(id: string, companyId: string) {
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  return request;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput, companyId: string, userId: string) {
  const request = await leavesRepository.create(companyId, input.employeeId, input.leaveTypeId, input.startDate, input.endDate, input.workingDays || null);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'leave_request', entityId: request.id, newValue: input as unknown as Record<string, unknown> });
  return request;
}

export async function approveLeaveRequest(id: string, input: ReviewLeaveInput, companyId: string, userId: string) {
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('Leave request is not pending', 400);

  const updated = await leavesRepository.updateStatus(id, 'approved', userId, input.approvalNote || null, companyId);
  if (request.working_days) {
    await leavesRepository.updateBalance(request.employee_id, request.leave_type_id, new Date(request.start_date).getFullYear(), request.working_days);
  }
  await auditLog({ userId, companyId, action: 'APPROVE', entity: 'leave_request', entityId: id, newValue: { status: 'approved' } });
  return updated;
}

export async function rejectLeaveRequest(id: string, input: ReviewLeaveInput, companyId: string, userId: string) {
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('Leave request is not pending', 400);

  const updated = await leavesRepository.updateStatus(id, 'rejected', userId, input.approvalNote || null, companyId);
  await auditLog({ userId, companyId, action: 'REJECT', entity: 'leave_request', entityId: id, newValue: { status: 'rejected' } });
  return updated;
}

export async function cancelLeaveRequest(id: string, companyId: string, userId: string) {
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status === 'cancelled') throw new AppError('Already cancelled', 400);

  const updated = await leavesRepository.updateStatus(id, 'cancelled', userId, null, companyId);
  if (request.status === 'approved' && request.working_days) {
    await leavesRepository.updateBalance(request.employee_id, request.leave_type_id, new Date(request.start_date).getFullYear(), -request.working_days);
  }
  await auditLog({ userId, companyId, action: 'CANCEL', entity: 'leave_request', entityId: id, newValue: { status: 'cancelled' } });
  return updated;
}

export async function getBalances(employeeId: string, year: number) {
  return leavesRepository.getBalances(employeeId, year);
}

export async function adjustBalance(employeeId: string, leaveTypeId: string, year: number, credited: number, companyId: string, userId: string) {
  await leavesRepository.adjustBalance(employeeId, leaveTypeId, year, credited);
  await auditLog({ userId, companyId, action: 'ADJUST_BALANCE', entity: 'leave_balance', entityId: employeeId, newValue: { leaveTypeId, year, credited } });
}
