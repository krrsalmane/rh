import { query } from '../../config/database';
import { LeaveFiltersInput } from './leaves.schema';
import { v4 as uuidv4 } from 'uuid';

export interface LeaveRequestRow {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  supporting_document_path: string | null;
  supporting_document_name: string | null;
  working_days: number | null;
  status: string;
  requested_at: string;
  approved_by: string | null;
  approval_note: string | null;
}

export async function getEmployeeInfo(employeeId: string, companyId: string) {
  const result = await query<{ name: string }>(
    `SELECT CONCAT(e.first_name, ' ', e.last_name) as name 
     FROM employees e 
     WHERE e.id = $1 AND e.company_id = $2`,
    [employeeId, companyId]
  );
  return result.rows[0] || null;
}

export async function findAll(filters: LeaveFiltersInput, companyId: string) {
  const conditions: string[] = ['lr.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;
  if (filters.employeeId) { conditions.push(`lr.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.leaveTypeId) { conditions.push(`lr.leave_type_id = $${idx}`); params.push(filters.leaveTypeId); idx++; }
  if (filters.status) { conditions.push(`lr.status = $${idx}`); params.push(filters.status); idx++; }
  if (filters.managerId) { conditions.push(`e.manager_id = $${idx}`); params.push(filters.managerId); idx++; }
  if (filters.excludeEmployeeId) { conditions.push(`lr.employee_id != $${idx}`); params.push(filters.excludeEmployeeId); idx++; }

  const whereClause = conditions.join(' AND ');
  
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM leave_requests lr 
     JOIN employees e ON lr.employee_id = e.id
     WHERE ${whereClause}`, 
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<LeaveRequestRow>(
    `SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.id
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     WHERE ${whereClause} ORDER BY lr.requested_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );
  
  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<LeaveRequestRow | null> {
  const result = await query<LeaveRequestRow>('SELECT * FROM leave_requests WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(
  companyId: string,
  employeeId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  workingDays: number | null,
  reason: string | null,
  supportingDocumentPath: string | null,
  supportingDocumentName: string | null
): Promise<LeaveRequestRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO leave_requests (
      id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, reason, supporting_document_path, supporting_document_name
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, companyId, employeeId, leaveTypeId, startDate, endDate, workingDays, reason, supportingDocumentPath, supportingDocumentName]
  );
  return (await findById(id, companyId))!;
}

export async function findOverlapping(employeeId: string, startDate: string, endDate: string): Promise<LeaveRequestRow[]> {
  const result = await query<LeaveRequestRow>(
    `SELECT * FROM leave_requests 
     WHERE employee_id = $1 
     AND status IN ('pending', 'approved')
     AND (
       (start_date <= $2 AND end_date >= $2) OR
       (start_date <= $3 AND end_date >= $3) OR
       (start_date >= $2 AND end_date <= $3)
     )`,
    [employeeId, startDate, endDate]
  );
  return result.rows;
}

export async function updateStatus(id: string, status: string, approvedBy: string, approvalNote: string | null, companyId: string): Promise<LeaveRequestRow | null> {
  await query(
    'UPDATE leave_requests SET status = $1, approved_by = $2, approval_note = $3 WHERE id = $4 AND company_id = $5',
    [status, approvedBy, approvalNote, id, companyId]
  );
  return findById(id, companyId);
}

export async function getBalance(employeeId: string, leaveTypeId: string, year: number) {
  const result = await query<{ id: string; credited: number; taken: number; remaining: number }>(
    'SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3',
    [employeeId, leaveTypeId, year]
  );
  return result.rows[0] || null;
}

export async function updateBalance(employeeId: string, leaveTypeId: string, year: number, days: number) {
  await query(
    `INSERT INTO leave_balances (employee_id, leave_type_id, year, credited, taken, remaining)
     VALUES ($1, $2, $3, 0, $4, -$4)
     ON DUPLICATE KEY UPDATE taken = taken + VALUES(taken), remaining = credited - (taken + VALUES(taken)), last_updated = NOW()`,
    [employeeId, leaveTypeId, year, days]
  );
}

export async function getBalances(employeeId: string, year: number) {
  const result = await query<{ leave_type_id: string; leave_type_name: string; credited: number; taken: number; remaining: number }>(
    `SELECT lb.*, lt.name as leave_type_name
     FROM leave_balances lb JOIN leave_types lt ON lb.leave_type_id = lt.id
     WHERE lb.employee_id = $1 AND lb.year = $2`,
    [employeeId, year]
  );
  return result.rows;
}

export async function adjustBalance(employeeId: string, leaveTypeId: string, year: number, credited: number) {
  await query(
    `INSERT INTO leave_balances (employee_id, leave_type_id, year, credited, remaining)
     VALUES ($1, $2, $3, $4, $4)
     ON DUPLICATE KEY UPDATE credited = VALUES(credited), remaining = credited - taken, last_updated = NOW()`,
    [employeeId, leaveTypeId, year, credited]
  );
}

export async function getLeaveTypesByCompany(companyId: string) {
  const result = await query<{ id: string; name: string; annual_days: number }>(
    'SELECT id, name, annual_days FROM leave_types WHERE company_id = $1 AND is_active = 1',
    [companyId]
  );
  return result.rows;
}

export async function createBalance(employeeId: string, leaveTypeId: string, year: number, credited: number) {
  const balanceId = uuidv4();
  await query(
    'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated) VALUES ($1, $2, $3, $4, $5, 0, $5, NOW())',
    [balanceId, employeeId, leaveTypeId, year, credited]
  );
}
