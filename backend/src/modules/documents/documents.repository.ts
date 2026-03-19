import { query } from '../../config/database';

export interface DocumentRow {
  id: string;
  company_id: string;
  employee_id: string | null;
  template_id: string | null;
  template_version: number | null;
  form_data: Record<string, unknown> | null;
  pdf_path: string | null;
  status: string;
  generated_by: string | null;
  generated_at: string;
}

export async function findAll(companyId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM generated_documents WHERE company_id = $1', [companyId]);
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<DocumentRow>(
    `SELECT gd.*, t.name as template_name, e.first_name || ' ' || e.last_name as employee_name
     FROM generated_documents gd
     LEFT JOIN templates t ON gd.template_id = t.id
     LEFT JOIN employees e ON gd.employee_id = e.id
     WHERE gd.company_id = $1 ORDER BY gd.generated_at DESC LIMIT $2 OFFSET $3`,
    [companyId, limit, offset]
  );
  return { items: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(id: string, companyId: string): Promise<DocumentRow | null> {
  const result = await query<DocumentRow>('SELECT * FROM generated_documents WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(
  companyId: string, templateId: string, employeeId: string,
  templateVersion: number, formData: Record<string, unknown>,
  pdfPath: string, generatedBy: string
): Promise<DocumentRow> {
  const result = await query<DocumentRow>(
    `INSERT INTO generated_documents (company_id, template_id, employee_id, template_version, form_data, pdf_path, generated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [companyId, templateId, employeeId, templateVersion, JSON.stringify(formData), pdfPath, generatedBy]
  );
  return result.rows[0];
}

export async function patchStatus(id: string, status: string, companyId: string): Promise<DocumentRow | null> {
  const result = await query<DocumentRow>(
    'UPDATE generated_documents SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
    [status, id, companyId]
  );
  return result.rows[0] || null;
}
