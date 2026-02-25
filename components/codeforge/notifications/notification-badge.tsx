'use client';

import React from 'react';
import { useNotificationStore } from '@/lib/stores/notification-store';

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
}

/** Notification badge — bell icon with unread count for the Status Bar */
export function NotificationBadge({ onClick, className = '' }: NotificationBadgeProps) {
  const { unreadCount } = useNotificationStore();

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-1 text-gray-400 hover:text-white transition-colors ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell icon (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Badge counter */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBadge;
