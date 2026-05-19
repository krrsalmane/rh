import { query } from '../../config/database';
import { CreateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';
import { v4 as uuidv4 } from 'uuid';

// Initialize columns for lunch break
(async () => {
  try { await query('ALTER TABLE time_entries ADD COLUMN lunch_out VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN lunch_in VARCHAR(5)'); } catch (e) {}
})();

export interface TimeEntryRow {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  total_hours: number | null;
  expected_hours: number | null;
  overtime: number;
  deficit: number;
  source: string;
  modified_by: string | null;
  reason: string | null;
  created_at: string;
  employee_name?: string;
}

function calculateHours(clockIn?: string, clockOut?: string, expectedHours: number = 8, lunchOut?: string, lunchIn?: string): { totalHours: number; overtime: number; deficit: number } {
  if (!clockIn || !clockOut) return { totalHours: 0, overtime: 0, deficit: 0 };
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);

  if (lunchOut && lunchIn) {
    const [lOutH, lOutM] = lunchOut.split(':').map(Number);
    const [lInH, lInM] = lunchIn.split(':').map(Number);
    const lunchMinutes = (lInH * 60 + lInM) - (lOutH * 60 + lOutM);
    if (lunchMinutes > 0) {
      totalMinutes -= lunchMinutes;
    }
  }

  const totalHours = Math.max(0, totalMinutes / 60);
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
  if (filters.managerId) { conditions.push(`e.manager_id = $${idx}`); params.push(filters.managerId); idx++; }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM time_entries te 
     JOIN employees e ON te.employee_id = e.id
     WHERE ${whereClause}`, 
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<TimeEntryRow>(
    `SELECT te.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
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

export async function findByEmployeeAndDate(employeeId: string, date: string, companyId: string): Promise<TimeEntryRow | null> {
  const result = await query<TimeEntryRow>(
    'SELECT * FROM time_entries WHERE employee_id = $1 AND company_id = $2 AND date = $3',
    [employeeId, companyId, date]
  );
  return result.rows[0] || null;
}

export async function findForExport(filters: TimeEntryFiltersInput, companyId: string) {
  const conditions: string[] = ['te.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.employeeId) { conditions.push(`te.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.startDate) { conditions.push(`te.date >= $${idx}`); params.push(filters.startDate); idx++; }
  if (filters.endDate) { conditions.push(`te.date <= $${idx}`); params.push(filters.endDate); idx++; }
  if (filters.managerId) { conditions.push(`e.manager_id = $${idx}`); params.push(filters.managerId); idx++; }

  const whereClause = conditions.join(' AND ');
  const result = await query<TimeEntryRow>(
    `SELECT te.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
     FROM time_entries te
     JOIN employees e ON te.employee_id = e.id
     WHERE ${whereClause} ORDER BY te.date DESC, te.clock_in DESC`,
    params
  );
  return result.rows;
}

export async function create(input: CreateTimeEntryInput, companyId: string, userId: string): Promise<TimeEntryRow> {
  const expectedHours = input.expectedHours || 8;
  const { totalHours, overtime, deficit } = calculateHours(input.clockIn, input.clockOut, expectedHours, input.lunchOut, input.lunchIn);
  const id = uuidv4();
  await query(
    `INSERT INTO time_entries (id, company_id, employee_id, date, clock_in, clock_out, lunch_out, lunch_in, total_hours, expected_hours, overtime, deficit, source, modified_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [id, companyId, input.employeeId, input.date, input.clockIn || null, input.clockOut || null, input.lunchOut || null, input.lunchIn || null,
     totalHours, expectedHours, overtime, deficit, input.source, userId, input.reason || null]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: Partial<CreateTimeEntryInput>, companyId: string, userId: string): Promise<TimeEntryRow | null> {
  const existing = await findById(id, companyId);
  if (!existing) return null;
  const clockIn = input.clockIn ?? existing.clock_in ?? undefined;
  const clockOut = input.clockOut ?? existing.clock_out ?? undefined;
  const lunchOut = input.lunchOut ?? existing.lunch_out ?? undefined;
  const lunchIn = input.lunchIn ?? existing.lunch_in ?? undefined;
  const expectedHours = input.expectedHours ?? existing.expected_hours ?? 8;
  const { totalHours, overtime, deficit } = calculateHours(clockIn, clockOut, expectedHours, lunchOut, lunchIn);

  await query(
    `UPDATE time_entries SET clock_in = $1, clock_out = $2, lunch_out = $3, lunch_in = $4, total_hours = $5, expected_hours = $6, overtime = $7, deficit = $8, source = $9, modified_by = $10, reason = $11
     WHERE id = $12 AND company_id = $13`,
    [clockIn || null, clockOut || null, lunchOut || null, lunchIn || null, totalHours, expectedHours,
     overtime, deficit, input.source || existing.source, userId, input.reason || existing.reason, id, companyId]
  );
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM time_entries WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getSummary(employeeId: string | undefined, startDate: string, endDate: string, companyId: string) {
  const hasEmployeeFilter = !!employeeId;
  const result = await query<{ total_hours: string; total_expected_hours: string; total_overtime: string; total_deficit: string; days_worked: string }>(
    hasEmployeeFilter
      ? `SELECT COALESCE(SUM(total_hours), 0) as total_hours,
         COALESCE(SUM(expected_hours), 0) as total_expected_hours,
         COALESCE(SUM(overtime), 0) as total_overtime,
         COALESCE(SUM(deficit), 0) as total_deficit,
         COUNT(*) as days_worked
       FROM time_entries WHERE employee_id = $1 AND company_id = $2 AND date BETWEEN $3 AND $4`
      : `SELECT COALESCE(SUM(total_hours), 0) as total_hours,
         COALESCE(SUM(expected_hours), 0) as total_expected_hours,
         COALESCE(SUM(overtime), 0) as total_overtime,
         COALESCE(SUM(deficit), 0) as total_deficit,
         COUNT(*) as days_worked
       FROM time_entries WHERE company_id = $1 AND date BETWEEN $2 AND $3`,
    hasEmployeeFilter
      ? [employeeId, companyId, startDate, endDate]
      : [companyId, startDate, endDate]
  );
  const row = result.rows[0];
  return {
    totalHours: parseFloat(row.total_hours),
    totalExpectedHours: parseFloat(row.total_expected_hours),
    totalOvertime: parseFloat(row.total_overtime),
    totalDeficit: parseFloat(row.total_deficit),
    daysWorked: parseInt(row.days_worked, 10),
  };
}
