import { query } from '../../config/database';
import { CreateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';
import { v4 as uuidv4 } from 'uuid';

// Initialize columns for lunch and prayer breaks
(async () => {
  try { await query('ALTER TABLE time_entries ADD COLUMN lunch_out VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN lunch_in VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN prayer_out VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN prayer_in VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN prayer2_out VARCHAR(5)'); } catch (e) {}
  try { await query('ALTER TABLE time_entries ADD COLUMN prayer2_in VARCHAR(5)'); } catch (e) {}
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
  prayer_out: string | null;
  prayer_in: string | null;
  prayer2_out: string | null;
  prayer2_in: string | null;
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

// Helper function to parse 24-hour time (HH:MM format) to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Count the number of prayer breaks taken in an entry
 * Currently supports only one prayer break, but can be extended for multiple
 */
export function countPrayerBreaks(prayerOut?: string, prayerIn?: string): number {
  // If both prayer times are recorded, count as 1 prayer break
  if (prayerOut && prayerIn) {
    const prayerOutMin = timeToMinutes(prayerOut);
    const prayerInMin = timeToMinutes(prayerIn);
    if (prayerOutMin !== null && prayerInMin !== null && prayerInMin > prayerOutMin) {
      return 1;
    }
  }
  return 0;
}

/**
 * Calculate prayer break duration in minutes
 */
export function calculatePrayerBreakDuration(prayerOut?: string, prayerIn?: string): number {
  if (!prayerOut || !prayerIn) return 0;
  
  const prayerOutMin = timeToMinutes(prayerOut);
  const prayerInMin = timeToMinutes(prayerIn);
  
  let duration = prayerInMin - prayerOutMin;
  if (duration < 0) {
    duration += 24 * 60; // Handle overnight prayer break
  }
  return Math.max(0, duration);
}

// Helper function to validate and parse 24-hour time
function parse24HourTime(time?: string): number | null {
  if (!time || typeof time !== 'string') return null;
  const trimmed = time.trim();
  
  // Match HH:MM or HH:MM:SS format
  const match = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])(?::([0-5]?[0-9]))?$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  // Validate 24-hour format (0-23 hours, 0-59 minutes)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  return hours * 60 + minutes;
}

function calculateHours(clockIn?: string, clockOut?: string, expectedHours: number = 8, lunchOut?: string, lunchIn?: string, prayerOut?: string, prayerIn?: string, prayer2Out?: string, prayer2In?: string): { totalHours: number; overtime: number; deficit: number } {
  if (!clockIn || !clockOut) return { totalHours: 0, overtime: 0, deficit: 0 };
  
  // Parse times in 24-hour format
  const inMinutes = parse24HourTime(clockIn);
  const outMinutes = parse24HourTime(clockOut);
  
  if (inMinutes === null || outMinutes === null) return { totalHours: 0, overtime: 0, deficit: 0 };
  
  let totalMinutes = outMinutes - inMinutes;
  
  // Handle overnight shifts (edge case where employee works past midnight)
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours
  }

  // Subtract lunch break time (24-hour format)
  if (lunchOut && lunchIn) {
    const lunchOutMin = parse24HourTime(lunchOut);
    const lunchInMin = parse24HourTime(lunchIn);
    
    if (lunchOutMin !== null && lunchInMin !== null) {
      let lunchMinutes = lunchInMin - lunchOutMin;
      if (lunchMinutes < 0) {
        lunchMinutes += 24 * 60; // Handle overnight lunch (very rare)
      }
      if (lunchMinutes > 0 && lunchMinutes <= 24 * 60) {
        totalMinutes -= lunchMinutes;
      }
    }
  }

  // Subtract prayer break time (24-hour format)
  if (prayerOut && prayerIn) {
    const prayerOutMin = parse24HourTime(prayerOut);
    const prayerInMin = parse24HourTime(prayerIn);
    
    if (prayerOutMin !== null && prayerInMin !== null) {
      let prayerMinutes = prayerInMin - prayerOutMin;
      if (prayerMinutes < 0) {
        prayerMinutes += 24 * 60; // Handle overnight prayer break (very rare)
      }
      if (prayerMinutes > 0 && prayerMinutes <= 24 * 60) {
        totalMinutes -= prayerMinutes;
      }
    }
  }

  // Subtract second prayer break time
  if (prayer2Out && prayer2In) {
    const prayer2OutMin = parse24HourTime(prayer2Out);
    const prayer2InMin = parse24HourTime(prayer2In);
    
    if (prayer2OutMin !== null && prayer2InMin !== null) {
      let prayer2Minutes = prayer2InMin - prayer2OutMin;
      if (prayer2Minutes < 0) {
        prayer2Minutes += 24 * 60;
      }
      if (prayer2Minutes > 0 && prayer2Minutes <= 24 * 60) {
        totalMinutes -= prayer2Minutes;
      }
    }
  }

  totalMinutes = Math.max(0, totalMinutes); // Ensure non-negative
  const totalHours = totalMinutes / 60;
  let overtime = Math.max(0, totalHours - expectedHours);
  
  if (overtime < 1) {
    overtime = 0;
  }
  
  const deficit = Math.max(0, expectedHours - totalHours);
  
  return { 
    totalHours: Math.round(totalHours * 100) / 100, 
    overtime: Math.round(overtime * 100) / 100, 
    deficit: Math.round(deficit * 100) / 100 
  };
}

function formatRowDate(row: TimeEntryRow): TimeEntryRow {
  if (row && row.date) {
    const rawDate = row.date as any;
    if (rawDate instanceof Date) {
      const d = rawDate;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      row.date = `${year}-${month}-${day}`;
    } else if (typeof row.date === 'string') {
      row.date = row.date.slice(0, 10);
    }
  }
  return row;
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

  return { items: result.rows.map(formatRowDate), pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<TimeEntryRow | null> {
  const result = await query<TimeEntryRow>('SELECT * FROM time_entries WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] ? formatRowDate(result.rows[0]) : null;
}

export async function findByEmployeeAndDate(employeeId: string, date: string, companyId: string): Promise<TimeEntryRow | null> {
  const result = await query<TimeEntryRow>(
    'SELECT * FROM time_entries WHERE employee_id = $1 AND company_id = $2 AND date = $3',
    [employeeId, companyId, date]
  );
  return result.rows[0] ? formatRowDate(result.rows[0]) : null;
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
  return result.rows.map(formatRowDate);
}

export async function create(input: CreateTimeEntryInput, companyId: string, userId: string): Promise<TimeEntryRow> {
  const expectedHours = input.expectedHours || 8;
  const { totalHours, overtime: calculatedOvertime, deficit } = calculateHours(input.clockIn, input.clockOut, expectedHours, input.lunchOut, input.lunchIn, input.prayerOut, input.prayerIn, input.prayer2Out, input.prayer2In);
  const overtime = input.overtime !== undefined ? input.overtime : calculatedOvertime;
  const id = uuidv4();
  await query(
    `INSERT INTO time_entries (id, company_id, employee_id, date, clock_in, clock_out, lunch_out, lunch_in, prayer_out, prayer_in, prayer2_out, prayer2_in, total_hours, expected_hours, overtime, deficit, source, modified_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [id, companyId, input.employeeId, input.date, input.clockIn || null, input.clockOut || null, input.lunchOut || null, input.lunchIn || null, input.prayerOut || null, input.prayerIn || null, input.prayer2Out || null, input.prayer2In || null,
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
  const prayerOut = input.prayerOut ?? existing.prayer_out ?? undefined;
  const prayerIn = input.prayerIn ?? existing.prayer_in ?? undefined;
  const prayer2Out = input.prayer2Out ?? existing.prayer2_out ?? undefined;
  const prayer2In = input.prayer2In ?? existing.prayer2_in ?? undefined;
  const expectedHours = input.expectedHours ?? existing.expected_hours ?? 8;
  const { totalHours, overtime: calculatedOvertime, deficit } = calculateHours(clockIn, clockOut, expectedHours, lunchOut, lunchIn, prayerOut, prayerIn, prayer2Out, prayer2In);
  const overtime = input.overtime !== undefined ? input.overtime : calculatedOvertime;

  await query(
    `UPDATE time_entries SET clock_in = $1, clock_out = $2, lunch_out = $3, lunch_in = $4, prayer_out = $5, prayer_in = $6, prayer2_out = $7, prayer2_in = $8, total_hours = $9, expected_hours = $10, overtime = $11, deficit = $12, source = $13, modified_by = $14, reason = $15
     WHERE id = $16 AND company_id = $17`,
    [clockIn || null, clockOut || null, lunchOut || null, lunchIn || null, prayerOut || null, prayerIn || null, prayer2Out || null, prayer2In || null, totalHours, expectedHours,
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
