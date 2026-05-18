import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/hooks';
import axiosInstance from '@/shared/api/axiosInstance';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken: token } = useAppSelector((state) => state.auth);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const role = useAppSelector((state) => state.auth.role);

  const upsertNotification = (notification: Notification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === notification.id)) {
        return prev;
      }
      setUnreadCount((count) => count + (notification.read ? 0 : 1));
      return [notification, ...prev];
    });
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.post('/notifications/read', { notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.post('/notifications/read-all');
      setNotifications(prev => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !userId || !role) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ||
      'http://localhost:3000';

    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      newSocket.emit('authenticate', {
        token,
        userId,
        role,
      });
    });

    newSocket.on('new_notification', (notification: Notification) => {
      upsertNotification(notification);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, userId, role]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
}
