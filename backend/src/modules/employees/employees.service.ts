import * as employeesRepository from './employees.repository';
import * as leaveTypesRepository from '../leave-types/leaveTypes.repository';
import * as leavesRepository from '../leaves/leaves.repository';
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeFiltersInput } from './employees.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getEmployees(filters: EmployeeFiltersInput, user: any) {
  const { companyId, role, id } = user;
  if (role === 'employee') filters.search = id; // Employee can only see self
  else if (role === 'manager') filters.managerId = id;
  return employeesRepository.findAll(filters, companyId);
}

export async function getProfile(user: any) {
  const employeeId = user.employeeId || user.id;
  const employee = await employeesRepository.findById(employeeId, user.companyId);
  if (!employee) throw new AppError('Employee not found', 404);
  return {
    id: employee.id,
    companyId: employee.company_id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    email: employee.email || '',
    department: employee.department || '',
    position: employee.function || '',
    phone: employee.phone || undefined,
    address: employee.address || undefined,
    hireDate: employee.hire_date,
    workScheduleName: employee.work_schedule_name || undefined,
    weeklyHours: employee.weekly_hours || undefined,
    dailyHours: employee.daily_hours || undefined,
    createdAt: employee.created_at,
  };
}

export async function getEmployeeById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  if (role === 'employee' && id !== userId) throw new AppError('Access denied', 403);
  
  const employee = await employeesRepository.findById(id, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  // Manager check for team membership
  if (role === 'manager' && employee.manager_id !== userId && id !== userId) {
    throw new AppError('Access denied', 403);
  }

  const leaveBalances = await employeesRepository.getLeaveBalances(id);
  return { employee, leaveBalances };
}

export async function createEmployee(input: CreateEmployeeInput, user: any) {
  const { companyId, id: userId } = user;
  // Check duplicate email within company
  if (input.email) {
    const existing = await employeesRepository.findByEmail(input.email, companyId);
    if (existing) {
      throw new AppError('Un employé avec cet email existe déjà', 409);
    }
  }

  const employee = await employeesRepository.create(input, companyId);

  // Initialize leave balances for new employee
  const currentYear = new Date().getFullYear();
  const leaveTypes = await leaveTypesRepository.findAll(companyId, 1, 100);
  
  for (const type of leaveTypes.items) {
    if (type.annual_days && type.annual_days > 0) {
      await leavesRepository.adjustBalance(employee.id, type.id, currentYear, type.annual_days);
    }
  }

  await auditLog({
    userId,
    companyId,
    action: 'CREATE',
    entity: 'employee',
    entityId: employee.id,
    newValue: input as unknown as Record<string, unknown>,
  });
  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput, user: any) {
  const { companyId, id: userId } = user;
  const existing = await employeesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Employee not found', 404);

  // If email changed, check for duplicate
  if (input.email && input.email !== existing.email) {
    const emailTaken = await employeesRepository.findByEmail(input.email, companyId, id);
    if (emailTaken) {
      throw new AppError('Un employé avec cet email existe déjà', 409);
    }
  }

  const updated = await employeesRepository.update(id, input, companyId);
  await auditLog({
    userId,
    companyId,
    action: 'UPDATE',
    entity: 'employee',
    entityId: id,
    oldValue: existing as unknown as Record<string, unknown>,
    newValue: input as unknown as Record<string, unknown>,
  });
  return updated;
}

export async function deleteEmployee(id: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await employeesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Employee not found', 404);

  // Check for pending leave requests
  const pendingCount = await employeesRepository.countPendingLeaveRequests(id);
  if (pendingCount > 0) {
    throw new AppError('Cannot delete employee with pending leave requests', 400);
  }

  await employeesRepository.remove(id, companyId);
  await auditLog({
    userId,
    companyId,
    action: 'DELETE',
    entity: 'employee',
    entityId: id,
    oldValue: existing as unknown as Record<string, unknown>,
  });
}

export async function getDepartments(user: any) {
  return employeesRepository.getDepartments(user.companyId);
}

export async function getLeaveBalances(employeeId: string, user: any) {
  const { companyId, role, id: userId } = user;
  if (role === 'employee' && employeeId !== userId) throw new AppError('Access denied', 403);
  if (role === 'manager') throw new AppError('Access denied', 403);
  
  // Verify employee belongs to company first
  const employee = await employeesRepository.findById(employeeId, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  return employeesRepository.getLeaveBalances(employeeId);
}
