import { query } from '../../config/database';
import { UpdateSettingsInput, CreateDepartmentInput } from './settings.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getCompanySettings(companyId: string) {
  const result = await query<{ id: string; name: string; logo_url: string | null; address: string | null; latitude: number; longitude: number; created_at: string }>(
    'SELECT * FROM companies WHERE id = $1', [companyId]
  );
  if (result.rows.length === 0) throw new AppError('Company not found', 404);
  return result.rows[0];
}

export async function updateCompanySettings(input: UpdateSettingsInput, companyId: string, userId: string) {
  const existing = await getCompanySettings(companyId);
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.address !== undefined) { fields.push(`address = $${idx}`); values.push(input.address); idx++; }
  if (input.logoUrl !== undefined) { fields.push(`logo_url = $${idx}`); values.push(input.logoUrl); idx++; }
  if (input.latitude !== undefined) { fields.push(`latitude = $${idx}`); values.push(input.latitude); idx++; }
  if (input.longitude !== undefined) { fields.push(`longitude = $${idx}`); values.push(input.longitude); idx++; }
  if (fields.length === 0) return existing;
  values.push(companyId);
  await query(`UPDATE companies SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'company', entityId: companyId, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return getCompanySettings(companyId);
}

export async function getDepartments(companyId: string) {
  const result = await query<{ id: string; name: string }>(
    'SELECT id, name FROM departments WHERE company_id = $1 ORDER BY name ASC',
    [companyId]
  );
  return result.rows;
}

export async function createDepartment(input: CreateDepartmentInput, companyId: string, userId: string) {
  // Check if department already exists
  const existing = await query<{ id: string }>(
    'SELECT id FROM departments WHERE company_id = $1 AND name = $2',
    [companyId, input.name]
  );
  if (existing.rows.length > 0) {
    throw new AppError('Department already exists', 400);
  }

  await query(
    'INSERT INTO departments (company_id, name) VALUES ($1, $2)',
    [companyId, input.name]
  );

  // MySQL doesn't support RETURNING, so fetch the inserted row
  const result = await query<{ id: string; name: string }>(
    'SELECT id, name FROM departments WHERE company_id = $1 AND name = $2 ORDER BY created_at DESC LIMIT 1',
    [companyId, input.name]
  );
  
  await auditLog({
    userId,
    companyId,
    action: 'CREATE',
    entity: 'department',
    entityId: result.rows[0].id,
    newValue: { name: input.name } as Record<string, unknown>,
  });

  return result.rows[0];
}

export async function deleteDepartment(departmentId: string, companyId: string, userId: string) {
  const existing = await query<{ id: string; name: string }>(
    'SELECT id, name FROM departments WHERE id = $1 AND company_id = $2',
    [departmentId, companyId]
  );
  
  if (existing.rows.length === 0) {
    throw new AppError('Department not found', 404);
  }

  await query('DELETE FROM departments WHERE id = $1', [departmentId]);
  
  await auditLog({
    userId,
    companyId,
    action: 'DELETE',
    entity: 'department',
    entityId: departmentId,
    oldValue: { name: existing.rows[0].name } as Record<string, unknown>,
  });

  return { status: 'success', message: 'Department deleted' };
}

