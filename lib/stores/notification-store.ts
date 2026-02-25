import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

/** Notification type variants */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Single notification entity */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  autoDismiss?: boolean;
  dismissAfterMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/** Notification input (without auto-generated fields) */
export type NotificationInput = Omit<Notification, 'id' | 'timestamp' | 'read'>;

/** Notification store interface */
export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  /** Add a new notification */
  addNotification: (notification: NotificationInput) => string;
  /** Remove a notification by ID */
  removeNotification: (id: string) => void;
  /** Mark a single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Clear all notifications */
  clearAll: () => void;
}

/** Default auto-dismiss delay in milliseconds */
const DEFAULT_DISMISS_MS = 5000;

/** Maximum notifications kept in memory */
const MAX_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (input: NotificationInput): string => {
    const id = uuidv4();
    const notification: Notification = {
      ...input,
      id,
      timestamp: Date.now(),
      read: false,
      autoDismiss: input.autoDismiss ?? true,
      dismissAfterMs: input.dismissAfterMs ?? DEFAULT_DISMISS_MS,
    };

    set((state) => {
      const updated = [notification, ...state.notifications];
      // Enforce max limit
      const trimmed = updated.slice(0, MAX_NOTIFICATIONS);
      return {
        notifications: trimmed,
        unreadCount: trimmed.filter((n) => !n.read).length,
      };
    });

    // Auto-dismiss if enabled
    if (notification.autoDismiss) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.dismissAfterMs);
    }

    return id;
  },

  removeNotification: (id: string) => {
    set((state) => {
      const filtered = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: filtered,
        unreadCount: filtered.filter((n) => !n.read).length,
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
