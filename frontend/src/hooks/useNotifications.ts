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

// Normalize a raw notification from the backend (snake_case + MySQL booleans)
// into the frontend Notification shape (camelCase + real booleans).
function normalizeNotification(raw: any): Notification {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    data: typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data,
    createdAt: raw.createdAt || raw.created_at || '',
    read: raw.read === 1 || raw.read === true,
  };
}

export function useNotifications() {
  const [state, setState] = useState({
    notifications: [] as Notification[],
    unreadCount: 0
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken: token } = useAppSelector((state) => state.auth);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const role = useAppSelector((state) => state.auth.role);

  const upsertNotification = (raw: any) => {
    const notification = normalizeNotification(raw);
    setState((prev) => {
      if (prev.notifications.some((item) => item.id === notification.id)) {
        return prev;
      }
      return {
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + (notification.read ? 0 : 1)
      };
    });
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      const rawData = response.data.data || [];
      const normalizedData = rawData.map(normalizeNotification);
      
      setState({
        notifications: normalizedData,
        unreadCount: response.data.unreadCount || 0
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.post('/notifications/read', { notificationId });
      setState(prev => ({
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axiosInstance.post('/notifications/read-all');
      setState(prev => ({
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0
      }));
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
      'http://localhost:3002';

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

    newSocket.on('new_notification', (notification: any) => {
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
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
}
