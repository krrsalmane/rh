import { query } from '../../config/database';
import { CreateLeaveTypeInput } from './leaveTypes.schema';
import { v4 as uuidv4 } from 'uuid';

export interface LeaveTypeRow {
  id: string;
  company_id: string;
  name: string;
  annual_days: number | null;
  accrual_rule: string | null;
  carry_over_max: number;
  requires_approval: boolean;
  is_active: boolean;
}

export async function findAll(companyId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM leave_types WHERE company_id = $1 AND is_active = true', [companyId]);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<LeaveTypeRow>('SELECT * FROM leave_types WHERE company_id = $1 AND is_active = true ORDER BY name LIMIT $2 OFFSET $3', [companyId, limit, offset]);
  return { items: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(id: string, companyId: string): Promise<LeaveTypeRow | null> {
  const result = await query<LeaveTypeRow>('SELECT * FROM leave_types WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateLeaveTypeInput, companyId: string): Promise<LeaveTypeRow> {
  const id = uuidv4();
  await query(
    'INSERT INTO leave_types (id, company_id, name, annual_days, accrual_rule, carry_over_max, requires_approval) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, companyId, input.name, input.annualDays || null, input.accrualRule || null, input.carryOverMax, input.requiresApproval]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: Partial<CreateLeaveTypeInput>, companyId: string): Promise<LeaveTypeRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (input.name !== undefined) { fields.push(`name = $${idx}`); values.push(input.name); idx++; }
  if (input.annualDays !== undefined) { fields.push(`annual_days = $${idx}`); values.push(input.annualDays); idx++; }
  if (input.accrualRule !== undefined) { fields.push(`accrual_rule = $${idx}`); values.push(input.accrualRule); idx++; }
  if (input.carryOverMax !== undefined) { fields.push(`carry_over_max = $${idx}`); values.push(input.carryOverMax); idx++; }
  if (input.requiresApproval !== undefined) { fields.push(`requires_approval = $${idx}`); values.push(input.requiresApproval); idx++; }
  if (fields.length === 0) return findById(id, companyId);
  values.push(id, companyId);
  await query(`UPDATE leave_types SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`, values);
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('UPDATE leave_types SET is_active = false WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}
