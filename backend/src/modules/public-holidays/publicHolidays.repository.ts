import { query } from '../../config/database';
import { CreatePublicHolidayInput } from './publicHolidays.schema';
import { v4 as uuidv4 } from 'uuid';

export interface PublicHolidayRow {
  id: string;
  company_id: string;
  name: string;
  date: string;
  year: number;
}

export async function findAll(companyId: string, year?: number, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;
  let whereClause = 'company_id = $1';
  const params: unknown[] = [companyId];
  if (year) { whereClause += ' AND year = $2'; params.push(year); }
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM public_holidays WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const idx = params.length + 1;
  const result = await query<PublicHolidayRow>(
    `SELECT * FROM public_holidays WHERE ${whereClause} ORDER BY date ASC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  return { items: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(id: string, companyId: string): Promise<PublicHolidayRow | null> {
  const result = await query<PublicHolidayRow>('SELECT * FROM public_holidays WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreatePublicHolidayInput, companyId: string): Promise<PublicHolidayRow> {
  const id = uuidv4();
  await query(
    'INSERT INTO public_holidays (id, company_id, name, date, year) VALUES ($1,$2,$3,$4,$5)',
    [id, companyId, input.name, input.date, input.year]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: Partial<CreatePublicHolidayInput>, companyId: string): Promise<PublicHolidayRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.date !== undefined) { fields.push(`date = $${idx}`); values.push(input.date); idx++; }
  if (input.year !== undefined) { fields.push(`year = $${idx}`); values.push(input.year); idx++; }
  if (fields.length === 0) return findById(id, companyId);
  values.push(id, companyId);
  await query(`UPDATE public_holidays SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`, values);
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM public_holidays WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function findNextHoliday(companyId: string): Promise<PublicHolidayRow | null> {
  const result = await query<PublicHolidayRow>(
    `SELECT * FROM public_holidays 
     WHERE company_id = $1 AND date >= CURRENT_DATE() 
     ORDER BY date ASC LIMIT 1`,
    [companyId]
  );
  return result.rows[0] || null;
}
