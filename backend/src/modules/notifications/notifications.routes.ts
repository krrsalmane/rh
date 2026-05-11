import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { getNotifications, markAsRead, getUnreadCount } from './notifications.controller';

const router = Router();

// Get user notifications
router.get('/', authenticate, getNotifications);

// Mark notification as read
router.post('/read', authenticate, markAsRead);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

export default router;


