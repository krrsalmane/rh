import * as employeesRepository from './employees.repository';
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeFiltersInput } from './employees.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getEmployees(filters: EmployeeFiltersInput, companyId: string) {
  return employeesRepository.findAll(filters, companyId);
}

export async function getEmployeeById(id: string, companyId: string) {
  const employee = await employeesRepository.findById(id, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  const leaveBalances = await employeesRepository.getLeaveBalances(id);
  return { employee, leaveBalances };
}

export async function createEmployee(input: CreateEmployeeInput, companyId: string, userId: string) {
  // Check duplicate email within company
  if (input.email) {
    const existing = await employeesRepository.findByEmail(input.email, companyId);
    if (existing) {
      throw new AppError('Un employé avec cet email existe déjà', 409);
    }
  }

  const employee = await employeesRepository.create(input, companyId);
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

export async function updateEmployee(id: string, input: UpdateEmployeeInput, companyId: string, userId: string) {
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

export async function deleteEmployee(id: string, companyId: string, userId: string) {
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

export async function getDepartments(companyId: string) {
  return employeesRepository.getDepartments(companyId);
}

export async function getLeaveBalances(employeeId: string, companyId: string) {
  // Verify employee belongs to company first
  const employee = await employeesRepository.findById(employeeId, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  return employeesRepository.getLeaveBalances(employeeId);
}
