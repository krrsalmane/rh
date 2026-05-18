import * as leavesRepository from './leaves.repository';
import { CreateLeaveRequestInput, ReviewLeaveInput, LeaveFiltersInput } from './leaves.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { calculateWorkingDays } from '../../shared/utils/dateUtils';
import { getNotificationService } from '../notifications/notifications.service';
import * as employeesRepository from '../employees/employees.repository';
import path from 'path';
import { getStoragePath } from '../../config/storage';

export async function getLeaveRequests(filters: LeaveFiltersInput, user: any) {
  const { companyId, role, id, employeeId } = user;
  
  if (role === 'employee') {
    filters.employeeId = employeeId || id;
  } else if (role === 'manager') {
    filters.managerId = id;
  }
  // Super admin and HR agent see all requests
  
  return await leavesRepository.findAll(filters, companyId);
}

export async function getLeaveRequestById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  
  if (role === 'employee' && request.employee_id !== userId) {
    throw new AppError('Access denied', 403);
  }
  if (role === 'manager') {
    const employee = await employeesRepository.findById(request.employee_id, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }
  
  return request;
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput,
  user: any,
  document?: { path: string; originalName: string }
) {
  const { companyId, role, id: userId } = user;
  
  const effectiveEmployeeId = role === 'employee' ? user.employeeId : input.employeeId;
  
  if (!effectiveEmployeeId) {
    throw new AppError('Employee ID is required', 400);
  }

  if (role === 'employee' && input.employeeId !== user.employeeId) {
    throw new AppError('You can only create leave requests for yourself', 403);
  }

  if (role === 'manager') {
    const employee = await employeesRepository.findById(effectiveEmployeeId, companyId);
    if (!employee || employee.manager_id !== userId) {
      throw new AppError('Access denied', 403);
    }
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
  
  const request = await leavesRepository.create(
    companyId,
    effectiveEmployeeId,
    input.leaveTypeId,
    input.startDate,
    input.endDate,
    workingDays,
    input.reason || null,
    document?.path || null,
    document?.originalName || null
  );
  await auditLog({
    userId,
    companyId,
    action: 'CREATE',
    entity: 'leave_request',
    entityId: request.id,
    newValue: {
      ...input,
      workingDays,
      supportingDocumentName: document?.originalName || null,
    } as unknown as Record<string, unknown>
  });
  
  // Send notifications to HR, managers, and super admins
  try {
    const notificationService = getNotificationService();
    const { createNotification } = await import('../notifications/notifications.service');
    
    // Get employee name for notification
    const employeeResult = await leavesRepository.getEmployeeInfo(effectiveEmployeeId, companyId);
    const employeeName = employeeResult?.name || 'Employé';
    
    // Send to HR agents
    await notificationService.sendNotificationToRole(companyId, 'hr_agent', {
      userId: '',
      type: 'leave_request',
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a demandé un congé - ${input.leaveTypeId}`,
      data: { employeeName, leaveType: input.leaveTypeId, reason: input.reason || '', hasDocument: Boolean(document) },
      companyId
    });
    
    // Send to managers
    await notificationService.sendNotificationToRole(companyId, 'manager', {
      userId: '',
      type: 'leave_request',
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a demandé un congé - ${input.leaveTypeId}`,
      data: { employeeName, leaveType: input.leaveTypeId, reason: input.reason || '', hasDocument: Boolean(document) },
      companyId
    });
    
    // Send to super admins
    await notificationService.sendNotificationToRole(companyId, 'super_admin', {
      userId: '',
      type: 'leave_request',
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a demandé un congé - ${input.leaveTypeId}`,
      data: { employeeName, leaveType: input.leaveTypeId, reason: input.reason || '', hasDocument: Boolean(document) },
      companyId
    });
  } catch (error) {
    console.error('❌ Error sending leave request notifications:', error);
    // Don't throw error - notification failure shouldn't break leave request creation
  }
  
  return request;
}

export async function getLeaveRequestDocument(id: string, user: any) {
  const request = await getLeaveRequestById(id, user);
  if (!request.supporting_document_path) {
    throw new AppError('Leave request has no supporting document', 404);
  }

  const storageRoot = path.resolve(getStoragePath('uploads'));
  const filePath = path.resolve(request.supporting_document_path);
  if (!filePath.startsWith(storageRoot)) {
    throw new AppError('Invalid document path', 400);
  }

  return {
    filePath,
    filename: request.supporting_document_name || path.basename(filePath),
  };
}

export async function approveLeaveRequest(id: string, input: ReviewLeaveInput, user: any) {
  const { companyId, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('Leave request is not pending', 400);
  if (user.role === 'manager') {
    const employee = await employeesRepository.findById(request.employee_id, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }

  const updated = await leavesRepository.updateStatus(id, 'approved', userId, input.approvalNote || null, companyId);
  if (request.working_days) {
    await leavesRepository.updateBalance(request.employee_id, request.leave_type_id, new Date(request.start_date).getFullYear(), request.working_days);
  }
  await auditLog({ userId, companyId, action: 'APPROVE', entity: 'leave_request', entityId: id, newValue: { status: 'approved' } });
  
  // Send notification to employee
  try {
    const notificationService = getNotificationService();
    const { createNotification } = await import('../notifications/notifications.service');
    
    const employeeResult = await leavesRepository.getEmployeeInfo(request.employee_id, companyId);
    const employeeName = employeeResult?.name || 'Employé';
    
    await notificationService.sendNotificationToUser(request.employee_id, {
      userId: request.employee_id,
      type: 'leave_approved',
      title: 'Demande de congé approuvée',
      message: `Votre demande de congé a été approuvée: ${input.approvalNote || 'Approuvée'}`,
      data: { employeeName, note: input.approvalNote || '' },
      companyId
    });
  } catch (error) {
    console.error('❌ Error sending leave approval notification:', error);
  }
  
  return updated;
}

export async function rejectLeaveRequest(id: string, input: ReviewLeaveInput, user: any) {
  const { companyId, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('Leave request is not pending', 400);
  if (user.role === 'manager') {
    const employee = await employeesRepository.findById(request.employee_id, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }

  const updated = await leavesRepository.updateStatus(id, 'rejected', userId, input.approvalNote || null, companyId);
  await auditLog({ userId, companyId, action: 'REJECT', entity: 'leave_request', entityId: id, newValue: { status: 'rejected' } });
  
  // Send notification to employee
  try {
    const notificationService = getNotificationService();
    const { createNotification } = await import('../notifications/notifications.service');
    
    const employeeResult = await leavesRepository.getEmployeeInfo(request.employee_id, companyId);
    const employeeName = employeeResult?.name || 'Employé';
    
    await notificationService.sendNotificationToUser(request.employee_id, {
      userId: request.employee_id,
      type: 'leave_rejected',
      title: 'Demande de congé refusée',
      message: `Votre demande de congé a été refusée: ${input.approvalNote || 'Refusée'}`,
      data: { employeeName, reason: input.approvalNote || '' },
      companyId
    });
  } catch (error) {
    console.error('❌ Error sending leave rejection notification:', error);
  }
  
  return updated;
}

export async function cancelLeaveRequest(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const request = await leavesRepository.findById(id, companyId);
  if (!request) throw new AppError('Leave request not found', 404);
  
  if (role === 'employee' && request.employee_id !== userId) {
    throw new AppError('Access denied', 403);
  }
  if (role === 'manager') {
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
  if (role === 'manager' && employeeId) {
    const employee = await employeesRepository.findById(employeeId, user.companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }
  
  // Get existing balances
  const balances = await leavesRepository.getBalances(effectiveEmployeeId!, year);
  
  // If no balances exist, create them
  if (balances.length === 0) {
    console.log(`🔍 No balances found for employee ${effectiveEmployeeId}, creating...`);
    await initializeEmployeeBalances(effectiveEmployeeId!, user.companyId, year);
    // Get balances again after initialization
    return leavesRepository.getBalances(effectiveEmployeeId!, year);
  }
  
  return balances;
}

async function initializeEmployeeBalances(employeeId: string, companyId: string, year: number) {
  // Get all leave types for this company
  const leaveTypes = await leavesRepository.getLeaveTypesByCompany(companyId);
  
  for (const leaveType of leaveTypes) {
    // Check if balance already exists for this leave type
    const existingBalance = await leavesRepository.getBalance(employeeId, leaveType.id, year);
    
    if (!existingBalance) {
      // Create new balance with default days
      const defaultDays = leaveType.annual_days || 25;
      await leavesRepository.createBalance(employeeId, leaveType.id, year, defaultDays);
      console.log(`✅ Created balance: employee ${employeeId}, leave type ${leaveType.name}, ${defaultDays} days`);
    }
  }
}

export async function adjustBalance(employeeId: string, leaveTypeId: string, year: number, credited: number, user: any) {
  const { companyId, id: userId } = user;
  await leavesRepository.adjustBalance(employeeId, leaveTypeId, year, credited);
  await auditLog({ userId, companyId, action: 'ADJUST_BALANCE', entity: 'leave_balance', entityId: employeeId, newValue: { leaveTypeId, year, credited } });
}
