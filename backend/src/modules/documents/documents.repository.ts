import { query } from '../../config/database';
import { DocumentFiltersInput } from './documents.schema';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentRow {
  id: string;
  company_id: string;
  employee_id: string | null;
  employee_name: string | null;
  template_id: string | null;
  template_name: string | null;
  template_version: number | null;
  form_data: Record<string, unknown> | null;
  pdf_path: string | null;
  status: string;
  generated_by: string | null;
  generated_by_email: string | null;
  generated_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export async function findAll(companyId: string, filters: DocumentFiltersInput): Promise<PaginatedResult<DocumentRow>> {
  const conditions: string[] = ['gd.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.employeeId) { conditions.push(`gd.employee_id = $${idx}`); params.push(filters.employeeId); idx++; }
  if (filters.templateId) { conditions.push(`gd.template_id = $${idx}`); params.push(filters.templateId); idx++; }
  if (filters.status) { conditions.push(`gd.status = $${idx}`); params.push(filters.status); idx++; }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM generated_documents gd WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<DocumentRow>(
    `SELECT gd.*,
       t.name as template_name,
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       u.email as generated_by_email
     FROM generated_documents gd
     LEFT JOIN templates t ON gd.template_id = t.id
     LEFT JOIN employees e ON gd.employee_id = e.id
     LEFT JOIN users u ON gd.generated_by = u.id
     WHERE ${whereClause}
     ORDER BY gd.generated_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );

  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<DocumentRow | null> {
  const result = await query<DocumentRow>(
    `SELECT gd.*,
       t.name as template_name,
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       u.email as generated_by_email
     FROM generated_documents gd
     LEFT JOIN templates t ON gd.template_id = t.id
     LEFT JOIN employees e ON gd.employee_id = e.id
     LEFT JOIN users u ON gd.generated_by = u.id
     WHERE gd.id = $1 AND gd.company_id = $2`,
    [id, companyId]
  );
  return result.rows[0] || null;
}

export async function create(
  companyId: string, templateId: string | null, employeeId: string,
  templateVersion: number, formData: Record<string, unknown>,
  pdfPath: string, generatedBy: string
): Promise<DocumentRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO generated_documents (id, company_id, template_id, employee_id, template_version, form_data, pdf_path, generated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, companyId, templateId, employeeId, templateVersion, JSON.stringify(formData), pdfPath, generatedBy]
  );
  return (await findById(id, companyId))!;
}

export async function patchStatus(id: string, status: string, companyId: string): Promise<DocumentRow | null> {
  await query(
    'UPDATE generated_documents SET status = $1 WHERE id = $2 AND company_id = $3',
    [status, id, companyId]
  );
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM generated_documents WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}
