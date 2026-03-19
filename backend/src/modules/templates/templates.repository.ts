import { query } from '../../config/database';
import { CreateTemplateInput } from './templates.schema';

export interface TemplateRow {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  language: string;
  body: string;
  variable_schema: unknown;
  version: number;
  status: string;
  created_by: string | null;
  created_at: string;
}

export async function findAll(companyId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM templates WHERE company_id = $1', [companyId]);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<TemplateRow>('SELECT * FROM templates WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [companyId, limit, offset]);
  return { items: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(id: string, companyId: string): Promise<TemplateRow | null> {
  const result = await query<TemplateRow>('SELECT * FROM templates WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateTemplateInput, companyId: string, userId: string): Promise<TemplateRow> {
  const result = await query<TemplateRow>(
    `INSERT INTO templates (company_id, name, category, language, body, variable_schema, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [companyId, input.name, input.category || null, input.language, input.body,
     input.variableSchema ? JSON.stringify(input.variableSchema) : null, input.status, userId]
  );
  return result.rows[0];
}

export async function update(id: string, input: Partial<CreateTemplateInput>, companyId: string): Promise<TemplateRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.category !== undefined) { fields.push(`category = $${idx}`); values.push(input.category); idx++; }
  if (input.language !== undefined) { fields.push(`language = $${idx}`); values.push(input.language); idx++; }
  if (input.body !== undefined) { fields.push(`body = $${idx}`); values.push(input.body); idx++; }
  if (input.variableSchema !== undefined) { fields.push(`variable_schema = $${idx}`); values.push(JSON.stringify(input.variableSchema)); idx++; }
  if (input.status !== undefined) { fields.push(`status = $${idx}`); values.push(input.status); idx++; }

  if (fields.length === 0) return findById(id, companyId);

  // Increment version on body change
  if (input.body !== undefined) { fields.push(`version = version + 1`); }

  values.push(id, companyId);
  const result = await query<TemplateRow>(`UPDATE templates SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1} RETURNING *`, values);
  return result.rows[0] || null;
}

export async function patchStatus(id: string, status: string, companyId: string): Promise<TemplateRow | null> {
  const result = await query<TemplateRow>('UPDATE templates SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *', [status, id, companyId]);
  return result.rows[0] || null;
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM templates WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}
