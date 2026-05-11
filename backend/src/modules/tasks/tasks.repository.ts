import { query } from '../../config/database';
import { CreateTaskInput, TaskFiltersInput } from './tasks.schema';
import { v4 as uuidv4 } from 'uuid';

export interface TaskRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  creator_name?: string;
}

export async function findAll(filters: TaskFiltersInput, companyId: string) {
  const conditions: string[] = ['t.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters.assignedTo) { conditions.push(`t.assigned_to = $${idx}`); params.push(filters.assignedTo); idx++; }
  if (filters.status) { conditions.push(`t.status = $${idx}`); params.push(filters.status); idx++; }
  if (filters.priority) { conditions.push(`t.priority = $${idx}`); params.push(filters.priority); idx++; }
  
  if (filters.managerId) {
    conditions.push(`e.manager_id = $${idx}`);
    params.push(filters.managerId);
    idx++;
  }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM tasks t 
     LEFT JOIN employees e ON t.assigned_to = e.id 
     WHERE ${whereClause}`, 
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<TaskRow>(
    `SELECT t.*, 
            CONCAT(e.first_name, ' ', e.last_name) as assignee_name,
            u.email as creator_name
     FROM tasks t
     LEFT JOIN employees e ON t.assigned_to = e.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE ${whereClause} 
     ORDER BY t.created_at DESC 
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );

  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(id: string, companyId: string): Promise<TaskRow | null> {
  const result = await query<TaskRow>('SELECT * FROM tasks WHERE id = $1 AND company_id = $2', [id, companyId]);
  return result.rows[0] || null;
}

export async function create(input: CreateTaskInput, companyId: string, userId: string): Promise<TaskRow> {
  const id = uuidv4();
  await query(
    `INSERT INTO tasks (id, company_id, title, description, assigned_to, created_by, priority, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, companyId, input.title, input.description || null, input.assignedTo || null, userId, input.priority || 'medium', input.dueDate || null]
  );
  return (await findById(id, companyId))!;
}

export async function update(id: string, input: any, companyId: string): Promise<TaskRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', assignedTo: 'assigned_to',
    status: 'status', priority: 'priority', dueDate: 'due_date'
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (key in input) {
      fields.push(`${dbField} = $${idx}`);
      values.push(input[key]);
      idx++;
    }
  }

  if (fields.length === 0) return findById(id, companyId);
  values.push(id, companyId);

  await query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx + 1}`, values);
  return findById(id, companyId);
}

export async function remove(id: string, companyId: string): Promise<boolean> {
  const result = await query('DELETE FROM tasks WHERE id = $1 AND company_id = $2', [id, companyId]);
  return (result.rowCount ?? 0) > 0;
}
