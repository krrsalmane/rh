import * as leavesRepository from './leaves.repository';
import { CreateLeaveRequestInput, ReviewLeaveInput, LeaveFiltersInput } from './leaves.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { calculateWorkingDays } from '../../shared/utils/dateUtils';

export async function getLeaveRequests(filters: LeaveFiltersInput, user: any) {
  const { companyId, role, id } = user;
  
  if (role === 'employee') {
    filters.employeeId = id;
  } else if (role === 'manager') {
    // Manager sees all leave requests except their own
    // Exclude current user's own leave requests from the list
    filters.excludeEmployeeId = id;
  }
  // Super admin and HR agent see all requests
  
  return leavesRepository.findAll(filters, companyId);
}

export async function getLeaveRequestById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  
  if (role === 'employee' && request.employee_id !== userId) {
    throw new AppError('Access denied', 403);
  }
  
  return request;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput, user: any) {
  const { companyId, role, id: userId } = user;
  
  const effectiveEmployeeId = role === 'employee' ? user.employeeId : input.employeeId;
  
  if (!effectiveEmployeeId) {
    throw new AppError('Employee ID is required', 400);
  }

  if (role === 'employee' && input.employeeId !== user.employeeId) {
    throw new AppError('You can only create leave requests for yourself', 403);
  }

  // Manager cannot create leave requests for themselves
  if (role === 'manager' && input.employeeId === userId) {
    throw new AppError('Managers cannot create leave requests for themselves', 403);
  }

  // 1. Check for overlapping requests
  const overlapping = await leavesRepository.findOverlapping(effectiveEmployeeId, input.startDate, input.endDate);
  if (overlapping.length > 0) {
    throw new AppError('Une demande de congé existe déjà pour cette période', 400);
  }

  // 2. Calculate working days if not provided
  let workingDays = input.workingDays;
  if (!workingDays) {
    workingDays = await calculateWorkingDays(new Date(input.startDate), new Date(input.endDate), companyId);
  }

  // 3. Check balance
  const year = new Date(input.startDate).getFullYear();
  const balance = await leavesRepository.getBalance(effectiveEmployeeId, input.leaveTypeId, year);
  
  if (!balance) {
    throw new AppError('Aucun solde de congés trouvé pour cet employé et ce type de congé pour l\'année ' + year, 400);
  }

  if (balance.remaining < workingDays) {
    throw new AppError(`Solde de congés insuffisant. Disponible: ${balance.remaining}, Demandé: ${workingDays}`, 400);
  }
  
  const request = await leavesRepository.create(companyId, effectiveEmployeeId, input.leaveTypeId, input.startDate, input.endDate, workingDays);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'leave_request', entityId: request.id, newValue: input as unknown as Record<string, unknown> });
  return request;
}

export async function approveLeaveRequest(id: string, input: ReviewLeaveInput, user: any) {
  const { companyId, id: userId } = user;
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

export async function rejectLeaveRequest(id: string, input: ReviewLeaveInput, user: any) {
  const { companyId, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('Leave request is not pending', 400);

  const updated = await leavesRepository.updateStatus(id, 'rejected', userId, input.approvalNote || null, companyId);
  await auditLog({ userId, companyId, action: 'REJECT', entity: 'leave_request', entityId: id, newValue: { status: 'rejected' } });
  return updated;
}

export async function cancelLeaveRequest(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  
  if (role === 'employee' && request.employee_id !== userId) {
    throw new AppError('Access denied', 403);
  }
  
  if (request.status === 'cancelled') throw new AppError('Already cancelled', 400);

  const updated = await leavesRepository.updateStatus(id, 'cancelled', userId, null, companyId);
  if (request.status === 'approved' && request.working_days) {
    await leavesRepository.updateBalance(request.employee_id, request.leave_type_id, new Date(request.start_date).getFullYear(), -request.working_days);
  }
  await auditLog({ userId, companyId, action: 'CANCEL', entity: 'leave_request', entityId: id, newValue: { status: 'cancelled' } });
  return updated;
}

export async function getBalances(employeeId: string, year: number, user: any) {
  const { role, id: userId } = user;
  const effectiveEmployeeId = role === 'employee' ? user.employeeId : employeeId;
  if (role === 'employee' && employeeId !== user.employeeId) {
    throw new AppError('Access denied', 403);
  }
  return leavesRepository.getBalances(effectiveEmployeeId!, year);
}

export async function adjustBalance(employeeId: string, leaveTypeId: string, year: number, credited: number, user: any) {
  const { companyId, id: userId } = user;
  await leavesRepository.adjustBalance(employeeId, leaveTypeId, year, credited);
  await auditLog({ userId, companyId, action: 'ADJUST_BALANCE', entity: 'leave_balance', entityId: employeeId, newValue: { leaveTypeId, year, credited } });
}
