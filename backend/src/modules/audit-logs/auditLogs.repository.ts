import { query } from '../../config/database';

export interface AuditLogRow {
  id: string;
  company_id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  timestamp: string;
}

interface AuditLogFilters {
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export async function findAll(filters: AuditLogFilters, companyId: string) {
  const conditions: string[] = ['al.company_id = $1'];
  const params: unknown[] = [companyId];
  let idx = 2;
  if (filters.entity) { conditions.push(`al.entity = $${idx}`); params.push(filters.entity); idx++; }
  if (filters.action) { conditions.push(`al.action = $${idx}`); params.push(filters.action); idx++; }
  if (filters.userId) { conditions.push(`al.user_id = $${idx}`); params.push(filters.userId); idx++; }
  if (filters.startDate) { conditions.push(`al.timestamp >= $${idx}`); params.push(filters.startDate); idx++; }
  if (filters.endDate) { conditions.push(`al.timestamp <= $${idx}`); params.push(filters.endDate); idx++; }

  const whereClause = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM audit_logs al WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (filters.page - 1) * filters.limit;

  const result = await query<AuditLogRow>(
    `SELECT al.*, u.email as user_email FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE ${whereClause} ORDER BY al.timestamp DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, filters.limit, offset]
  );
  return { items: result.rows, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}
