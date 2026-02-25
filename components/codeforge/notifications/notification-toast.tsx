'use client';

import React, { useState } from 'react';
import {
  useNotificationStore,
  type Notification,
} from '@/lib/stores/notification-store';

/** Icon mapping for notification types */
const typeIcons: Record<Notification['type'], string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

/** Background color mapping for notification types */
const typeBgColors: Record<Notification['type'], string> = {
  info: 'border-l-blue-500',
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
};

interface NotificationToastItemProps {
  notification: Notification;
}

function NotificationToastItem({ notification }: NotificationToastItemProps) {
  const { removeNotification } = useNotificationStore();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeNotification(notification.id), 200);
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-md border-l-4 bg-[#252526] p-4 shadow-lg transition-all duration-200 ${typeBgColors[notification.type]
        } ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <span className="mt-0.5 text-lg">{typeIcons[notification.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{notification.title}</p>
        {notification.message && (
          <p className="mt-1 text-xs text-gray-400">{notification.message}</p>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

/** Toast container — renders in the bottom-right corner */
export function NotificationToast() {
  const { notifications } = useNotificationStore();


  // Show only unread, most recent 5 notifications
  const toastNotifications = notifications.filter((n) => !n.read).slice(0, 5);



  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toastNotifications.map((notification) => (
        <NotificationToastItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
}

export default NotificationToast;
