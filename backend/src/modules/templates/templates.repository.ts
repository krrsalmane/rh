import { query } from '../../config/database';
import { CreateTemplateInput, TemplateFiltersInput } from './templates.schema';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateRow {
  id: string;
  company_id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  body_translations: unknown;
  variable_schema: unknown;
  version: number;
  status: string;
  usage_count: number;
  created_by: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export async function findAll(companyId: string, filters: TemplateFiltersInput): Promise<PaginatedResult<TemplateRow>> {
  const conditions: string[] = ['t.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.status) { conditions.push(`t.status = $${idx}`); params.push(filters.status); idx++; }
  if (filters.category) { conditions.push(`t.category = $${idx}`); params.push(filters.category); idx++; }
  if (filters.language) { conditions.push(`t.language = $${idx}`); params.push(filters.language); idx++; }
  if (filters.search) { conditions.push(`t.name LIKE $${idx}`); params.push(`%${filters.search}%`); idx++; }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM templates t WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<TemplateRow>(
    `SELECT t.id, t.name, t.category, t.language, t.body_translations, t.status, t.version, t.variable_schema, t.created_by, t.created_at,
       (SELECT COUNT(*) FROM generated_documents WHERE template_id = t.id) as usage_count
     FROM templates t
     WHERE ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );

  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findActive(companyId: string): Promise<TemplateRow[]> {
  const result = await query<TemplateRow>(
    `SELECT t.*, (SELECT COUNT(*) FROM generated_documents WHERE template_id = t.id) as usage_count
     FROM templates t WHERE t.company_id = $1 AND t.status = 'active' ORDER BY t.name`,
    [companyId]
  );
  return result.rows;
}

export async function findById(id: string, companyId: string): Promise<TemplateRow | null> {
  const result = await query<TemplateRow>(
    `SELECT t.*, (SELECT COUNT(*) FROM generated_documents WHERE template_id = t.id) as usage_count
     FROM templates t WHERE t.id = $1 AND t.company_id = $2`,
    [id, companyId]
  );
  return result.rows[0] || null;
}

export async function findByName(name: string, companyId: string, excludeId?: string): Promise<TemplateRow | null> {
  if (excludeId) {
    const result = await query<TemplateRow>('SELECT * FROM templates WHERE name = $1 AND company_id = $2 AND id != $3', [name, companyId, excludeId]);
    return result.rows[0] || null;
  }
  const result = await query<TemplateRow>('SELECT * FROM templates WHERE name = $1 AND company_id = $2', [name, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateTemplateInput, companyId: string, userId: string): Promise<TemplateRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO templates (id, company_id, name, category, language, body, body_translations, variable_schema, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, companyId, input.name, input.category, input.language, input.body,
      input.bodyTranslations ? JSON.stringify(input.bodyTranslations) : null,
      JSON.stringify(input.variableSchema || []), input.status || 'draft', userId]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: Partial<CreateTemplateInput>, companyId: string): Promise<TemplateRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.category !== undefined) { fields.push(`category = $${idx}`); values.push(input.category); idx++; }
  if (input.language !== undefined) { fields.push(`language = $${idx}`); values.push(input.language); idx++; }
  if (input.body !== undefined) { fields.push(`body = $${idx}`); values.push(input.body); idx++; }
  if (input.bodyTranslations !== undefined) { fields.push(`body_translations = $${idx}`); values.push(JSON.stringify(input.bodyTranslations)); idx++; }
  if (input.variableSchema !== undefined) { fields.push(`variable_schema = $${idx}`); values.push(JSON.stringify(input.variableSchema)); idx++; }
  if (input.status !== undefined) { fields.push(`status = $${idx}`); values.push(input.status); idx++; }

  if (fields.length === 0) return findById(id, companyId);

  // Always increment version on update
  fields.push(`version = version + 1`);

  values.push(id, companyId);
  await query(
    `UPDATE templates SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`,
    values
  );
  return findById(id, companyId);
}

export async function patchStatus(id: string, status: string, companyId: string): Promise<TemplateRow | null> {
  await query(
    'UPDATE templates SET status = $1 WHERE id = $2 AND company_id = $3',
    [status, id, companyId]
  );
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM templates WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUsageCount(templateId: string): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM generated_documents WHERE template_id = $1', [templateId]);
  return parseInt(result.rows[0].count, 10);
}

export async function deleteTemplateRecord(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM templates WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function detachDocumentsFromTemplate(id: string, companyId: string): Promise<void> {
  await query('UPDATE generated_documents SET template_id = NULL WHERE template_id = $1 AND company_id = $2', [id, companyId]);
}
