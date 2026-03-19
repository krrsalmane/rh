import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { CreateUserInput, UpdateUserInput } from './users.schema';

export interface UserRow {
  id: string;
  company_id: string;
  email: string;
  role: string;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  must_change_password: boolean;
  employee_name: string | null;
  department: string | null;
  function: string | null;
}

interface FindAllFilters {
  search?: string;
  role?: string;
  isActive?: string;
}

const USER_SELECT = `
  u.id, u.company_id, u.email, u.role, u.employee_id,
  u.is_active, u.created_at, u.last_login, u.must_change_password,
  CASE WHEN e.id IS NOT NULL THEN e.first_name || ' ' || e.last_name ELSE NULL END as employee_name,
  e.department,
  e.function
`;

const USER_FROM = `
  users u
  LEFT JOIN employees e ON u.employee_id = e.id
`;

export async function findAll(companyId: string, filters: FindAllFilters, page: number = 1, limit: number = 20) {
  const conditions: string[] = ['u.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.search) {
    conditions.push(`u.email ILIKE '%' || $${idx} || '%'`);
    params.push(filters.search);
    idx++;
  }
  if (filters.role) {
    conditions.push(`u.role = $${idx}`);
    params.push(filters.role);
    idx++;
  }
  if (filters.isActive !== undefined && filters.isActive !== '') {
    conditions.push(`u.is_active = $${idx}`);
    params.push(filters.isActive === 'true');
    idx++;
  }

  const whereClause = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ${USER_FROM} WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<UserRow>(
    `SELECT ${USER_SELECT} FROM ${USER_FROM} WHERE ${whereClause} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return {
    items: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function findById(id: string, companyId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_SELECT} FROM ${USER_FROM} WHERE u.id = $1 AND u.company_id = $2`,
    [id, companyId]
  );
  return result.rows[0] || null;
}

export async function findByEmail(email: string, companyId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_SELECT} FROM ${USER_FROM} WHERE u.email = $1 AND u.company_id = $2`,
    [email.toLowerCase().trim(), companyId]
  );
  return result.rows[0] || null;
}

export async function create(input: CreateUserInput, companyId: string): Promise<UserRow> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await query<UserRow>(
    `INSERT INTO users (company_id, email, password_hash, role, employee_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company_id, email, role, employee_id, is_active, created_at, last_login, must_change_password`,
    [companyId, input.email.toLowerCase().trim(), passwordHash, input.role, input.employeeId || null]
  );
  // Re-fetch with join to get employee_name
  return (await findById(result.rows[0].id, companyId))!;
}

export async function update(id: string, input: UpdateUserInput, companyId: string): Promise<UserRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.email !== undefined) {
    fields.push(`email = $${idx}`);
    values.push(input.email.toLowerCase().trim());
    idx++;
  }
  if (input.role !== undefined) {
    fields.push(`role = $${idx}`);
    values.push(input.role);
    idx++;
  }
  if (input.isActive !== undefined) {
    fields.push(`is_active = $${idx}`);
    values.push(input.isActive);
    idx++;
  }
  if (input.employeeId !== undefined) {
    fields.push(`employee_id = $${idx}`);
    values.push(input.employeeId);
    idx++;
  }

  if (fields.length === 0) return findById(id, companyId);

  values.push(id, companyId);
  await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`,
    values
  );
  return findById(id, companyId);
}

export async function deactivate(id: string, companyId: string): Promise<UserRow | null> {
  await query(
    'UPDATE users SET is_active = false WHERE id = $1 AND company_id = $2',
    [id, companyId]
  );
  return findById(id, companyId);
}

export async function reactivate(id: string, companyId: string): Promise<UserRow | null> {
  await query(
    'UPDATE users SET is_active = true WHERE id = $1 AND company_id = $2',
    [id, companyId]
  );
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function updatePassword(id: string, companyId: string, hash: string, mustChange: boolean = false): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, must_change_password = $2 WHERE id = $3 AND company_id = $4',
    [hash, mustChange, id, companyId]
  );
}

export async function updateLastLogin(id: string): Promise<void> {
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
}

export async function getPasswordHash(id: string, companyId: string): Promise<string | null> {
  const result = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1 AND company_id = $2',
    [id, companyId]
  );
  return result.rows[0]?.password_hash || null;
}

export async function countByRole(companyId: string, role: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE company_id = $1 AND role = $2',
    [companyId, role]
  );
  return parseInt(result.rows[0].count, 10);
}
