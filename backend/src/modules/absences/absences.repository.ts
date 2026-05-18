import { query } from '../../config/database';
import { CreateAbsenceInput, AbsenceFiltersInput } from './absences.schema';
import { v4 as uuidv4 } from 'uuid';

export interface AbsenceRow {
  id: string;
  company_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: string | null;
  justification_status: string;
  reason: string | null;
  attachments: unknown;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
}

export async function findAll(filters: AbsenceFiltersInput, companyId: string) {
  const conditions: string[] = ['a.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;
  if (filters.employeeId) { conditions.push(`a.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.type) { conditions.push(`a.type = $${idx}`); params.push(filters.type); idx++; }
  if (filters.justificationStatus) { conditions.push(`a.justification_status = $${idx}`); params.push(filters.justificationStatus); idx++; }
  if (filters.startDate) { conditions.push(`a.start_date >= $${idx}`); params.push(filters.startDate); idx++; }
  if (filters.endDate) { conditions.push(`a.end_date <= $${idx}`); params.push(filters.endDate); idx++; }
  if (filters.department) { conditions.push(`e.department = $${idx}`); params.push(filters.department); idx++; }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM absences a 
     JOIN employees e ON a.employee_id = e.id
     WHERE ${whereClause}`, 
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;
  const result = await query<AbsenceRow>(
    `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name FROM absences a JOIN employees e ON a.employee_id = e.id WHERE ${whereClause} ORDER BY a.start_date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );
  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<AbsenceRow | null> {
  const result = await query<AbsenceRow>('SELECT * FROM absences WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateAbsenceInput, companyId: string): Promise<AbsenceRow> {
  const id = uuidv4();
  await query(
    'INSERT INTO absences (id, company_id, employee_id, start_date, end_date, type, reason) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, companyId, input.employeeId, input.startDate, input.endDate, input.type || null, input.reason || null]
  );
  return (await findById(id, companyId))!;
}

export async function findOverlapping(employeeId: string, startDate: string, endDate: string): Promise<AbsenceRow[]> {
  const result = await query<AbsenceRow>(
    `SELECT * FROM absences 
     WHERE employee_id = $1 
     AND (
       (start_date <= $2 AND end_date >= $2) OR
       (start_date <= $3 AND end_date >= $3) OR
       (start_date >= $2 AND end_date <= $3)
     )`,
    [employeeId, startDate, endDate]
  );
  return result.rows;
}

export async function justify(id: string, reviewNote: string, attachments: string[], reviewedBy: string, companyId: string): Promise<AbsenceRow | null> {
  await query(
    `UPDATE absences SET justification_status = 'justified', review_note = $1, attachments = $2, reviewed_by = $3 WHERE id = $4 AND company_id = $5`,
    [reviewNote, JSON.stringify(attachments), reviewedBy, id, companyId]
  );
  return findById(id, companyId);
}

export async function markUnjustified(id: string, reviewNote: string, reviewedBy: string, companyId: string): Promise<AbsenceRow | null> {
  await query(
    `UPDATE absences SET justification_status = 'unjustified', review_note = $1, reviewed_by = $2 WHERE id = $3 AND company_id = $4`,
    [reviewNote, reviewedBy, id, companyId]
  );
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM absences WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAnalytics(companyId: string, startDate: string, endDate: string) {
  const result = await query<{ type: string; count: string; justified: string; unjustified: string; pending: string }>(
    `SELECT COALESCE(type, 'untyped') as type, COUNT(*) as count,
     SUM(CASE WHEN justification_status='justified' THEN 1 ELSE 0 END) as justified,
     SUM(CASE WHEN justification_status='unjustified' THEN 1 ELSE 0 END) as unjustified,
     SUM(CASE WHEN justification_status='pending' THEN 1 ELSE 0 END) as pending
     FROM absences WHERE company_id = $1 AND start_date >= $2 AND end_date <= $3 GROUP BY type`,
    [companyId, startDate, endDate]
  );
  return result.rows;
}
