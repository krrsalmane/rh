import { query } from '../../config/database';
import { CreateWorkScheduleInput } from './workSchedules.schema';
import { v4 as uuidv4 } from 'uuid';

export interface WorkScheduleRow {
  id: string;
  company_id: string;
  name: string;
  weekly_hours: number | null;
  daily_hours: number | null;
  work_days: number[] | null;
  break_minutes: number;
  is_rotating: boolean;
}

export async function findAll(companyId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM work_schedules WHERE company_id = $1', [companyId]);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<WorkScheduleRow>('SELECT * FROM work_schedules WHERE company_id = $1 ORDER BY name LIMIT $2 OFFSET $3', [companyId, limit, offset]);
  return { items: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(id: string, companyId: string): Promise<WorkScheduleRow | null> {
  const result = await query<WorkScheduleRow>('SELECT * FROM work_schedules WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateWorkScheduleInput, companyId: string): Promise<WorkScheduleRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO work_schedules (id, company_id, name, weekly_hours, daily_hours, work_days, break_minutes, is_rotating)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, companyId, input.name, input.weeklyHours || null, input.dailyHours || null,
     JSON.stringify(input.workDays || null), input.breakMinutes, input.isRotating]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: Partial<CreateWorkScheduleInput>, companyId: string): Promise<WorkScheduleRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.weeklyHours !== undefined) { fields.push(`weekly_hours = $${idx}`); values.push(input.weeklyHours); idx++; }
  if (input.dailyHours !== undefined) { fields.push(`daily_hours = $${idx}`); values.push(input.dailyHours); idx++; }
  if (input.workDays !== undefined) { fields.push(`work_days = $${idx}`); values.push(JSON.stringify(input.workDays)); idx++; }
  if (input.breakMinutes !== undefined) { fields.push(`break_minutes = $${idx}`); values.push(input.breakMinutes); idx++; }
  if (input.isRotating !== undefined) { fields.push(`is_rotating = $${idx}`); values.push(input.isRotating); idx++; }
  if (fields.length === 0) return findById(id, companyId);
  values.push(id, companyId);
  await query(`UPDATE work_schedules SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`, values);
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM work_schedules WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}
