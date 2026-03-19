import { query } from '../../config/database';
import { CreateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';

export interface TimeEntryRow {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  expected_hours: number | null;
  overtime: number;
  deficit: number;
  source: string;
  modified_by: string | null;
  reason: string | null;
  created_at: string;
}

function calculateHours(clockIn?: string, clockOut?: string): { totalHours: number; overtime: number; deficit: number } {
  if (!clockIn || !clockOut) return { totalHours: 0, overtime: 0, deficit: 0 };
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  const totalHours = Math.max(0, totalMinutes / 60);
  const expectedHours = 8;
  const overtime = Math.max(0, totalHours - expectedHours);
  const deficit = Math.max(0, expectedHours - totalHours);
  return { totalHours: Math.round(totalHours * 100) / 100, overtime: Math.round(overtime * 100) / 100, deficit: Math.round(deficit * 100) / 100 };
}

export async function findAll(filters: TimeEntryFiltersInput, companyId: string) {
  const conditions: string[] = ['te.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.employeeId) { conditions.push(`te.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.startDate) { conditions.push(`te.date >= $${idx}`); params.push(filters.startDate); idx++; }
  if (filters.endDate) { conditions.push(`te.date <= $${idx}`); params.push(filters.endDate); idx++; }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM time_entries te WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<TimeEntryRow>(
    `SELECT te.*, e.first_name || ' ' || e.last_name as employee_name
     FROM time_entries te
     JOIN employees e ON te.employee_id = e.id
     WHERE ${whereClause} ORDER BY te.date DESC, te.clock_in DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );

  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<TimeEntryRow | null> {
  const result = await query<TimeEntryRow>('SELECT * FROM time_entries WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateTimeEntryInput, companyId: string, userId: string): Promise<TimeEntryRow> {
  const { totalHours, overtime, deficit } = calculateHours(input.clockIn, input.clockOut);
  const result = await query<TimeEntryRow>(
    `INSERT INTO time_entries (company_id, employee_id, date, clock_in, clock_out, total_hours, expected_hours, overtime, deficit, source, modified_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [companyId, input.employeeId, input.date, input.clockIn || null, input.clockOut || null,
     totalHours, input.expectedHours || 8, overtime, deficit, input.source, userId, input.reason || null]
  );
  return result.rows[0];
}

export async function update(id: string, input: Partial<CreateTimeEntryInput>, companyId: string, userId: string): Promise<TimeEntryRow | null> {
  const existing = await findById(id, companyId);
  if (!existing) return null;
  const clockIn = input.clockIn ?? existing.clock_in ?? undefined;
  const clockOut = input.clockOut ?? existing.clock_out ?? undefined;
  const { totalHours, overtime, deficit } = calculateHours(clockIn, clockOut);

  const result = await query<TimeEntryRow>(
    `UPDATE time_entries SET clock_in = $1, clock_out = $2, total_hours = $3, expected_hours = $4, overtime = $5, deficit = $6, source = $7, modified_by = $8, reason = $9
     WHERE id = $10 AND company_id = $11 RETURNING *`,
    [clockIn || null, clockOut || null, totalHours, input.expectedHours || existing.expected_hours || 8,
     overtime, deficit, input.source || existing.source, userId, input.reason || existing.reason, id, companyId]
  );
  return result.rows[0] || null;
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM time_entries WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getSummary(employeeId: string, startDate: string, endDate: string, companyId: string) {
  const result = await query<{ total_hours: string; total_overtime: string; total_deficit: string; days_worked: string }>(
    `SELECT COALESCE(SUM(total_hours), 0) as total_hours, COALESCE(SUM(overtime), 0) as total_overtime,
     COALESCE(SUM(deficit), 0) as total_deficit, COUNT(*) as days_worked
     FROM time_entries WHERE employee_id = $1 AND company_id = $2 AND date BETWEEN $3 AND $4`,
    [employeeId, companyId, startDate, endDate]
  );
  const row = result.rows[0];
  return {
    totalHours: parseFloat(row.total_hours),
    totalOvertime: parseFloat(row.total_overtime),
    totalDeficit: parseFloat(row.total_deficit),
    daysWorked: parseInt(row.days_worked, 10),
  };
}
