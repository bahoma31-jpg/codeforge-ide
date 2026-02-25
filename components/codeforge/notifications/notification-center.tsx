'use client';

import React, { useState } from 'react';
import { useNotificationStore, type NotificationType } from '@/lib/stores/notification-store';

/** Filter tabs for notification types */
const filterTabs: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
];

/** Type badge colors */
const typeDotColors: Record<NotificationType, string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Notification center panel — shows all notifications with filtering */
export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-96 h-full bg-[#1e1e1e] border-l border-[#333] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Mark all read
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-[#333] px-4 py-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                activeFilter === tab.value
                  ? 'bg-[#333] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-3xl mb-2">🔔</span>
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 border-b border-[#252526] px-4 py-3 transition-colors hover:bg-[#252526] ${
                  notification.read ? 'opacity-60' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${typeDotColors[notification.type]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{notification.title}</p>
                  {notification.message && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">
                      {notification.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="text-gray-600 hover:text-gray-300 text-xs"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
