import { Request, Response } from 'express';
import { authenticate } from '../../shared/middleware/auth';

function getNotificationServiceSafe() {
  try {
    // Lazy import to avoid initialization issues
    const { getNotificationService } = require('./notifications.service');
    return getNotificationService();
  } catch (error) {
    return null;
  }
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const notificationService = getNotificationServiceSafe();
    if (!notificationService) {
      return res.status(503).json({ 
        success: false, 
        message: 'Notification service not available' 
      });
    }

    const userId = (req as any).user.id;
    const { limit = 10 } = req.query;
    
    const notifications = await notificationService.findByUserId(userId as string, Number(limit));
    
    res.json({
      success: true,
      data: notifications,
      unreadCount: await notificationService.findUnreadCount(userId as string)
    });
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve notifications' 
    });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const notificationService = getNotificationServiceSafe();
    if (!notificationService) {
      return res.status(503).json({ 
        success: false, 
        message: 'Notification service not available' 
      });
    }

    const userId = (req as any).user.id;
    const { notificationId } = req.body;
    
    await notificationService.markAsRead(notificationId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const notificationService = getNotificationServiceSafe();
    if (!notificationService) {
      return res.status(503).json({ 
        success: false, 
        message: 'Notification service not available' 
      });
    }

    const userId = (req as any).user.id;
    
    const count = await notificationService.findUnreadCount(userId as string);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
}
