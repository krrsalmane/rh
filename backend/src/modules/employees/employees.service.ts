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
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput, companyId: string, userId: string) {
  const employee = await employeesRepository.create(input, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'employee', entityId: employee.id, newValue: input as unknown as Record<string, unknown> });
  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput, companyId: string, userId: string) {
  const existing = await employeesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Employee not found', 404);
  const updated = await employeesRepository.update(id, input, companyId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'employee', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteEmployee(id: string, companyId: string, userId: string) {
  const existing = await employeesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Employee not found', 404);
  await employeesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'employee', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function deactivateEmployee(id: string, companyId: string, userId: string) {
  const existing = await employeesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Employee not found', 404);
  const updated = await employeesRepository.updateStatus(id, 'inactive', companyId);
  await auditLog({ userId, companyId, action: 'DEACTIVATE', entity: 'employee', entityId: id, oldValue: { status: existing.status }, newValue: { status: 'inactive' } });
  return updated;
}
