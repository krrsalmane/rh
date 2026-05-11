import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { query } from '../../config/database';
import { auditLog } from '../../shared/utils/auditLogger';
import * as notificationsRepository from './notifications.repository';

interface NotificationData {
  id: string;
  userId: string;
  companyId: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'absence_declared' | 'document_generated' | 'task_assigned';
  title: string;
  message: string;
  data?: any;
  createdAt: string;
}

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: 'super_admin' | 'hr_agent' | 'manager' | 'employee';
}

class NotificationService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5175",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      await notificationsRepository.markAsRead(notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      socket.on('authenticate', async (data) => {
        try {
          const { token, userId, role } = data;
          
          // Verify user token and get user info
          const userResult = await query(
            'SELECT id, email, role, company_id FROM users WHERE id = $1 AND is_active = 1',
            [userId]
          );
          
          if (userResult.rows.length === 0) {
            socket.emit('auth_error', { message: 'Invalid user' });
            return;
          }

          const user = userResult.rows[0];
          
          // Join company-specific room
          const roomName = `company_${user.company_id}`;
          socket.join(roomName);

          // Store connected user
          this.connectedUsers.set(userId, {
            userId,
            socketId: socket.id,
            role: user.role as 'super_admin' | 'hr_agent' | 'manager' | 'employee'
          });

          socket.emit('authenticated', { 
            success: true, 
            user: { 
              id: user.id, 
              email: user.email, 
              role: user.role 
            } 
          });

          // Send unread notifications
          await this.sendUnreadNotifications(userId, socket);

          console.log(`✅ User ${user.email} authenticated and joined room ${roomName}`);
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        
        // Remove from connected users
        for (const [userId, user] of this.connectedUsers.entries()) {
          if (user.socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
      });

      socket.on('mark_notification_read', async (data) => {
        try {
          const notificationId = data.notificationId;
          await this.markNotificationAsRead(notificationId);
        } catch (error) {
          console.error('❌ Error marking notification as read:', error);
        }
      });
    });
  }

  async sendUnreadNotifications(userId: string, socket: any) {
    try {
      const result = await notificationsRepository.findByUserId(userId, 10);

      for (const notification of result) {
        socket.emit('new_notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.parse(notification.data) : null,
          createdAt: notification.created_at
        });
      }
    } catch (error) {
      console.error('❌ Error sending unread notifications:', error);
    }
  }

  async sendNotificationToUser(userId: string, notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) {
    try {
      // Store notification in database
      const insertedId = await notificationsRepository.create({
        user_id: userId,
        company_id: notification.companyId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: JSON.stringify(notification.data || {})
      });

      // Send to connected user
      const connectedUser = this.connectedUsers.get(userId);
      if (connectedUser) {
        this.io.to(connectedUser.socketId).emit('new_notification', {
          id: insertedId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.parse(notification.data) : null,
          createdAt: new Date().toISOString()
        });
      }

      console.log(`📬 Notification sent to User ${userId}: ${notification.title}`);
      return insertedId;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  async sendNotificationToRole(companyId: string, role: string, notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) {
    try {
      // Get all users with specified role in company
      const usersResult = await query(
        'SELECT id FROM users WHERE company_id = $1 AND role = $2 AND is_active = 1',
        [companyId, role]
      );

      for (const user of usersResult.rows) {
        await this.sendNotificationToUser(user.id as string, {
          ...notification,
          companyId
        });
      }

      console.log(`📬 Notification sent to ${usersResult.rows.length} users with role ${role}: ${notification.title}`);
    } catch (error: any) {
      console.error('❌ Error sending notification to role:', error);
      throw error;
    }
  }

  async sendNotificationToCompany(companyId: string, notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) {
    try {
      // Get all active users in company
      const usersResult = await query(
        'SELECT id FROM users WHERE company_id = $1 AND is_active = 1',
        [companyId]
      );

      for (const user of usersResult.rows) {
        await this.sendNotificationToUser(user.id as string, {
          ...notification,
          companyId
        });
      }

      console.log(`📬 Company notification sent to ${usersResult.rows.length} users: ${notification.title}`);
    } catch (error) {
      console.error('❌ Error sending company notification:', error);
      throw error;
    }
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  async findByUserId(userId: string, limit: number = 10) {
    return await notificationsRepository.findByUserId(userId, limit);
  }

  async findUnreadCount(userId: string): Promise<number> {
    return await notificationsRepository.findUnreadCount(userId);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await notificationsRepository.markAsRead(notificationId);
  }
}

// Singleton instance
let notificationService: NotificationService;

export function initializeNotifications(server: any) {
  if (!notificationService) {
    notificationService = new NotificationService(server);
  }
  return notificationService;
}

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    throw new Error('Notification service not initialized. Call initializeNotifications first.');
  }
  return notificationService;
}

// Helper functions for common notification types
export const NotificationTypes = {
  LEAVE_REQUEST: 'leave_request' as const,
  LEAVE_APPROVED: 'leave_approved' as const,
  LEAVE_REJECTED: 'leave_rejected' as const,
  ABSENCE_DECLARED: 'absence_declared' as const,
  DOCUMENT_GENERATED: 'document_generated' as const,
  TASK_ASSIGNED: 'task_assigned' as const,
};

export const createNotification = {
  leaveRequest: (userId: string, employeeName: string, leaveType: string) => ({
    type: NotificationTypes.LEAVE_REQUEST,
    title: 'Nouvelle demande de congé',
    message: `${employeeName} a demandé un congé - ${leaveType}`,
    data: { employeeName, leaveType }
  }),

  leaveApproved: (userId: string, employeeName: string, days: number) => ({
    type: NotificationTypes.LEAVE_APPROVED,
    title: 'Demande de congé approuvée',
    message: `La demande de congé de ${employeeName} pour ${days} jour(s) a été approuvée`,
    data: { employeeName, days }
  }),

  leaveRejected: (userId: string, employeeName: string, reason: string) => ({
    type: NotificationTypes.LEAVE_REJECTED,
    title: 'Demande de congé refusée',
    message: `La demande de congé de ${employeeName} a été refusée: ${reason}`,
    data: { employeeName, reason }
  }),

  absenceDeclared: (userId: string, employeeName: string, type: string) => ({
    type: NotificationTypes.ABSENCE_DECLARED,
    title: 'Nouvelle absence déclarée',
    message: `${employeeName} a déclaré une absence - ${type}`,
    data: { employeeName, type }
  }),

  documentGenerated: (userId: string, employeeName: string, documentType: string) => ({
    type: NotificationTypes.DOCUMENT_GENERATED,
    title: 'Document généré',
    message: `Un nouveau ${documentType} a été généré pour ${employeeName}`,
    data: { employeeName, documentType }
  }),

  taskAssigned: (userId: string, taskTitle: string, assignedBy: string) => ({
    type: NotificationTypes.TASK_ASSIGNED,
    title: 'Nouvelle tâche assignée',
    message: `${assignedBy} vous a assigné une nouvelle tâche: ${taskTitle}`,
    data: { taskTitle, assignedBy }
  })
};
