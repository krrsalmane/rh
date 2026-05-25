import { query } from '../../config/database';
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeFiltersInput } from './employees.schema';
import { v4 as uuidv4 } from 'uuid';

export interface EmployeeRow {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  cne: string | null;
  cin: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hire_date: string;
  contract_type: string;
  function: string | null;
  department: string | null;
  salary: number | null;
  status: string;
  work_schedule_id: string | null;
  work_schedule_name: string | null;
  weekly_hours: number | null;
  daily_hours: number | null;
  manager_id: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function findAll(filters: EmployeeFiltersInput, companyId: string): Promise<PaginatedResult<EmployeeRow>> {
  const conditions: string[] = ['e.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.search) {
    if (filters.search.length === 36) {
      conditions.push(`e.id = $${idx}`);
      params.push(filters.search);
    } else {
      conditions.push(`(e.first_name LIKE $${idx} OR e.last_name LIKE $${idx} OR e.email LIKE $${idx} OR e.cin LIKE $${idx})`);
      params.push(`%${filters.search}%`);
    }
    idx++;
  }
  if (filters.department) { conditions.push(`e.department = $${idx}`); params.push(filters.department); idx++; }
  if (filters.status) { conditions.push(`e.status = $${idx}`); params.push(filters.status); idx++; }
  if (filters.contractType) { conditions.push(`e.contract_type = $${idx}`); params.push(filters.contractType); idx++; }
  if (filters.managerId) { conditions.push(`e.manager_id = $${idx}`); params.push(filters.managerId); idx++; }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT e.id) as count FROM employees e WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<EmployeeRow>(
    `SELECT
      e.*,
      ws.name as work_schedule_name,
      ws.weekly_hours,
      ws.daily_hours
    FROM employees e
    LEFT JOIN work_schedules ws ON e.work_schedule_id = ws.id
    WHERE ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );

  // Deduplicate rows in case of multiple work_schedules per employee
  const uniqueEmployees = Array.from(new Map(result.rows.map(r => [r.id, r])).values());

  return {
    items: uniqueEmployees,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(id: string, companyId: string): Promise<EmployeeRow | null> {
  const result = await query<EmployeeRow>(
    `SELECT
      e.*,
      ws.name as work_schedule_name,
      ws.weekly_hours,
      ws.daily_hours
    FROM employees e
    LEFT JOIN work_schedules ws ON e.work_schedule_id = ws.id
    WHERE e.id = $1 AND e.company_id = $2`,
    [id, companyId]
  );
  return result.rows[0] || null;
}

export async function findByEmail(email: string, companyId: string, excludeId?: string): Promise<EmployeeRow | null> {
  if (excludeId) {
    const result = await query<EmployeeRow>(
      'SELECT * FROM employees WHERE email = $1 AND company_id = $2 AND id != $3',
      [email, companyId, excludeId]
    );
    return result.rows[0] || null;
  }
  const result = await query<EmployeeRow>(
    'SELECT * FROM employees WHERE email = $1 AND company_id = $2',
    [email, companyId]
  );
  return result.rows[0] || null;
}

export async function create(input: CreateEmployeeInput, companyId: string): Promise<EmployeeRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO employees (id, company_id, first_name, last_name, cne, cin, address, phone, email, hire_date, contract_type, \`function\`, department, salary, status, work_schedule_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id,
      companyId,
      input.firstName,
      input.lastName,
      input.cne || null,
      input.cin || null,
      input.address || null,
      input.phone || null,
      input.email || null,
      input.hireDate,
      input.contractType,
      input.function || null,
      input.department || null,
      input.salary ?? null,
      input.status || 'active',
      input.workScheduleId || null,
    ]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: UpdateEmployeeInput, companyId: string): Promise<EmployeeRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    firstName: 'first_name', lastName: 'last_name', cne: 'cne', cin: 'cin',
    address: 'address', phone: 'phone', email: 'email', hireDate: 'hire_date',
    contractType: 'contract_type', function: '`function`', department: 'department',
    salary: 'salary', status: 'status', workScheduleId: 'work_schedule_id',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (key in input) {
      fields.push(`${dbField} = $${idx}`);
      values.push((input as Record<string, unknown>)[key]);
      idx++;
    }
  }

  if (fields.length === 0) return findById(id, companyId);
  values.push(id, companyId);

  await query(`UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`, values);
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM employees WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getDepartments(companyId: string): Promise<string[]> {
  const result = await query<{ department: string }>(
    `SELECT DISTINCT department FROM employees WHERE company_id = $1 AND department IS NOT NULL AND department != '' ORDER BY department`,
    [companyId]
  );
  return result.rows.map((r) => r.department);
}

export async function countPendingLeaveRequests(employeeId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = $1 AND status = 'pending'`,
    [employeeId]
  );
  return parseInt(result.rows[0].count, 10);
}

export interface LeaveBalanceRow {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  credited: number;
  taken: number;
  remaining: number;
}

export async function getLeaveBalances(employeeId: string): Promise<LeaveBalanceRow[]> {
  const result = await query<LeaveBalanceRow>(
    `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = YEAR(CURRENT_DATE())`,
    [employeeId]
  );
  return result.rows;
}
