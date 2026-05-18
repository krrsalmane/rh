import { query } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationRow {
  id: string;
  user_id: string;
  company_id: string;
  type: string;
  title: string;
  message: string;
  data: string | null;
  created_at: string;
  read: boolean;
  read_at: string | null;
}

export async function create(notification: Omit<NotificationRow, 'id' | 'created_at' | 'read' | 'read_at'>): Promise<string> {
  const id = uuidv4();
  await query(
    `INSERT INTO notifications (id, user_id, company_id, type, title, message, data, created_at, \`read\`) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 0)`,
    [id, notification.user_id, notification.company_id, notification.type, notification.title, notification.message, notification.data]
  );
  return id;
}

export async function findByUserId(userId: string, limit: number = 10): Promise<NotificationRow[]> {
  const result = await query<NotificationRow>(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await query(
    'UPDATE notifications SET `read` = 1, read_at = NOW() WHERE id = $1',
    [notificationId]
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET `read` = 1, read_at = NOW() WHERE user_id = $1 AND `read` = 0',
    [userId]
  );
}

export async function findUnreadCount(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND `read` = 0',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function createTable(): Promise<void> {
  await query(
    'CREATE TABLE IF NOT EXISTS notifications (' +
      'id VARCHAR(36) PRIMARY KEY, ' +
      'user_id VARCHAR(36) NOT NULL, ' +
      'company_id VARCHAR(36) NOT NULL, ' +
      'type VARCHAR(50) NOT NULL, ' +
      'title VARCHAR(255) NOT NULL, ' +
      'message TEXT NOT NULL, ' +
      'data JSON, ' +
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ' +
      '`read` BOOLEAN DEFAULT FALSE, ' +
      'read_at TIMESTAMP NULL, ' +
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, ' +
      'FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, ' +
      'INDEX idx_notifications_user_read (user_id, `read`), ' +
      'INDEX idx_notifications_created (created_at)' +
    ')'
  );
}
