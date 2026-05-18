import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from './notifications.controller';

const router = Router();

// Get user notifications
router.get('/', authenticate, getNotifications);

// Mark notification as read
router.post('/read', authenticate, markAsRead);

// Mark all notifications as read
router.post('/read-all', authenticate, markAllAsRead);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

export default router;


