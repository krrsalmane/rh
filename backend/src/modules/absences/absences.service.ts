import * as absencesRepository from './absences.repository';
import { CreateAbsenceInput, AbsenceFiltersInput } from './absences.schema';
import * as employeesRepository from '../employees/employees.repository';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { query } from '../../config/database';

export async function getAbsences(filters: AbsenceFiltersInput, user: any) {
  const { companyId, role, id, employeeId: selfEmployeeId } = user;
  if (role === 'employee') {
    filters.employeeId = selfEmployeeId || id;
  } else if (role === 'manager') {
    // Fetch manager's department
    const managerDeptResult = await query<{ department: string }>(
      `SELECT e.department FROM employees e
       JOIN users u ON e.id = u.employee_id
       WHERE u.id = $1 AND u.company_id = $2`,
      [id, companyId]
    );
    const department = managerDeptResult.rows[0]?.department;
    if (department) {
      filters.department = department;
    }
  }
  return absencesRepository.findAll(filters, companyId);
}

export async function getAbsenceById(id: string, user: any) {
  const { companyId, role, id: userId, employeeId: selfEmployeeId } = user;
  const absence = await absencesRepository.findById(id, companyId);
  if (!absence) throw new AppError('Absence not found', 404);
  if (role === 'employee' && absence.employee_id !== (selfEmployeeId || userId)) throw new AppError('Access denied', 403);
  return absence;
}

export async function createAbsence(input: CreateAbsenceInput, user: any) {
  const { companyId, role, id: userId, employeeId: selfEmployeeId } = user;
  const effectiveEmployeeId = role === 'employee' ? (selfEmployeeId || userId) : input.employeeId;
  if (role === 'employee' && input.employeeId !== effectiveEmployeeId) throw new AppError('Access denied', 403);
  if (role !== 'super_admin' && role !== 'hr_agent' && role !== 'employee') throw new AppError('Access denied', 403);

  const employee = await employeesRepository.findById(effectiveEmployeeId, companyId);
  if (!employee) {
    throw new AppError('Employee profile not found', 400);
  }

  // Check for overlapping absences
  const overlapping = await absencesRepository.findOverlapping(effectiveEmployeeId, input.startDate, input.endDate);
  if (overlapping.length > 0) {
    throw new AppError('Un enregistrement d\'absence existe déjà pour cette période', 400);
  }

  const absence = await absencesRepository.create({ ...input, employeeId: effectiveEmployeeId }, companyId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'absence', entityId: absence.id, newValue: { ...input, employeeId: effectiveEmployeeId } as unknown as Record<string, unknown> });
  return absence;
}

export async function justifyAbsence(id: string, reviewNote: string, attachments: string[], user: any) {
  const { companyId, id: userId } = user;
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  const updated = await absencesRepository.justify(id, reviewNote, attachments, userId, companyId);
  await auditLog({ userId, companyId, action: 'JUSTIFY', entity: 'absence', entityId: id, newValue: { justificationStatus: 'justified', reviewNote } });
  return updated;
}

export async function markUnjustified(id: string, reviewNote: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  const updated = await absencesRepository.markUnjustified(id, reviewNote, userId, companyId);
  await auditLog({ userId, companyId, action: 'MARK_UNJUSTIFIED', entity: 'absence', entityId: id, newValue: { justificationStatus: 'unjustified', reviewNote } });
  return updated;
}

export async function deleteAbsence(id: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await absencesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Absence not found', 404);
  await absencesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'absence', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function getAnalytics(user: any, startDate: string, endDate: string) {
  const { companyId, role, id: userId } = user;
  if (role !== 'super_admin' && role !== 'hr_agent') {
    throw new AppError('Access denied', 403);
  }
  return absencesRepository.getAnalytics(companyId, startDate, endDate);
}
