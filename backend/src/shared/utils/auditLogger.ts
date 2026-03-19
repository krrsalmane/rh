import { query } from '../../config/database';

interface AuditLogEntry {
  userId: string;
  companyId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  await query(
    `INSERT INTO audit_logs (company_id, user_id, action, entity, entity_id, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.companyId,
      entry.userId,
      entry.action,
      entry.entity,
      entry.entityId,
      entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
    ]
  );
}
