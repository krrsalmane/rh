import * as timeRepository from './time.repository';
import { CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';
import * as employeesRepository from '../employees/employees.repository';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getTimeEntries(filters: TimeEntryFiltersInput, user: any) {
  const { companyId, role, id } = user;
  if (role === 'employee') filters.employeeId = id;
  else if (role === 'manager') filters.managerId = id;
  return timeRepository.findAll(filters, companyId);
}

export async function getTimeEntryById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const entry = await timeRepository.findById(id, companyId);
  if (!entry) throw new AppError('Time entry not found', 404);
  if (role === 'employee' && entry.employee_id !== userId) throw new AppError('Access denied', 403);
  if (role === 'manager') {
    const employee = await employeesRepository.findById(entry.employee_id, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }
  return entry;
}

export async function createTimeEntry(input: CreateTimeEntryInput, user: any) {
  const { companyId, role, id: userId } = user;
  if (role !== 'super_admin' && role !== 'hr_agent') throw new AppError('Access denied', 403);

  // Auto-calculate expected hours from schedule
  if (!input.expectedHours) {
    const employee = await employeesRepository.findById(input.employeeId, companyId);
    if (employee && employee.daily_hours) {
      input.expectedHours = employee.daily_hours;
    }
  }

  const entry = await timeRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'time_entry', entityId: entry.id, newValue: input as unknown as Record<string, unknown> });
  return entry;
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput, user: any) {
  const { companyId, id: userId } = user;
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  const updated = await timeRepository.update(id, input, companyId, userId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteTimeEntry(id: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  await timeRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function getTimeSummary(employeeId: string, startDate: string, endDate: string, user: any) {
  const { companyId, role, id: userId } = user;
  if (role === 'employee' && employeeId && employeeId !== userId) throw new AppError('Access denied', 403);
  if (role === 'manager' && employeeId) {
    const employee = await employeesRepository.findById(employeeId, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }
  const targetId = role === 'employee' ? userId : employeeId;
  return timeRepository.getSummary(targetId, startDate, endDate, companyId);
}
