import { query } from '../../config/database';
import { LeaveFiltersInput } from './leaves.schema';

export interface LeaveRequestRow {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  working_days: number | null;
  status: string;
  requested_at: string;
  approved_by: string | null;
  approval_note: string | null;
}

export async function findAll(filters: LeaveFiltersInput, companyId: string) {
  const conditions: string[] = ['lr.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;
  if (filters.employeeId) { conditions.push(`lr.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.leaveTypeId) { conditions.push(`lr.leave_type_id = $${idx}`); params.push(filters.leaveTypeId); idx++; }
  if (filters.status) { conditions.push(`lr.status = $${idx}`); params.push(filters.status); idx++; }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM leave_requests lr WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<LeaveRequestRow>(
    `SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, lt.name as leave_type_name
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

export async function create(companyId: string, employeeId: string, leaveTypeId: string, startDate: string, endDate: string, workingDays: number | null): Promise<LeaveRequestRow> {
  const result = await query<LeaveRequestRow>(
    'INSERT INTO leave_requests (company_id, employee_id, leave_type_id, start_date, end_date, working_days) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [companyId, employeeId, leaveTypeId, startDate, endDate, workingDays]
  );
  return result.rows[0];
}

export async function updateStatus(id: string, status: string, approvedBy: string, approvalNote: string | null, companyId: string): Promise<LeaveRequestRow | null> {
  const result = await query<LeaveRequestRow>(
    'UPDATE leave_requests SET status = $1, approved_by = $2, approval_note = $3 WHERE id = $4 AND company_id = $5 RETURNING *',
    [status, approvedBy, approvalNote, id, companyId]
  );
  return result.rows[0] || null;
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
     ON CONFLICT (employee_id, leave_type_id, year)
     DO UPDATE SET taken = leave_balances.taken + $4, remaining = leave_balances.credited - (leave_balances.taken + $4), last_updated = NOW()`,
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
     ON CONFLICT (employee_id, leave_type_id, year)
     DO UPDATE SET credited = $4, remaining = $4 - leave_balances.taken, last_updated = NOW()`,
    [employeeId, leaveTypeId, year, credited]
  );
}
