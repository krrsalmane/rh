import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate based on type
    switch (notification.type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        navigate('/leaves');
        break;
      case 'absence_declared':
        navigate('/absences');
        break;
      case 'document_generated':
        navigate('/documents');
        break;
      case 'task_assigned':
        navigate('/tasks');
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop - z-40 */}
          <div 
            className="fixed inset-0" 
            style={{ zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown - z-50 so it's ABOVE the backdrop */}
          <div 
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200"
            style={{ zIndex: 50 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    className="btn-form-cancel text-[11px]"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
