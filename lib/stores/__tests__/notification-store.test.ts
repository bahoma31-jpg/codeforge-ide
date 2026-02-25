import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificationStore } from '../notification-store';

// Reset store before each test
function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
  });
}

describe('NotificationStore', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty notifications', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should add a notification', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'Test' });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.notifications[0].type).toBe('info');
  });

  it('should return the notification ID when adding', () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({ type: 'success', title: 'Created' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should set read to false for new notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'Unread test' });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(false);
  });

  it('should set timestamp automatically', () => {
    const { addNotification } = useNotificationStore.getState();
    const before = Date.now();
    addNotification({ type: 'info', title: 'Time test' });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].timestamp).toBeGreaterThanOrEqual(before);
  });

  it('should increment unreadCount when adding unread notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'One' });
    addNotification({ type: 'error', title: 'Two' });

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(2);
  });

  it('should remove a notification by ID', () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({ type: 'info', title: 'To remove', autoDismiss: false });
    addNotification({ type: 'success', title: 'Keep', autoDismiss: false });

    useNotificationStore.getState().removeNotification(id);

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe('Keep');
  });

  it('should update unreadCount after removing a notification', () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({ type: 'info', title: 'Remove me', autoDismiss: false });
    addNotification({ type: 'info', title: 'Stay', autoDismiss: false });

    expect(useNotificationStore.getState().unreadCount).toBe(2);

    useNotificationStore.getState().removeNotification(id);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('should mark a notification as read', () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({ type: 'warning', title: 'Read me', autoDismiss: false });

    useNotificationStore.getState().markAsRead(id);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('should mark all notifications as read', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'A', autoDismiss: false });
    addNotification({ type: 'error', title: 'B', autoDismiss: false });
    addNotification({ type: 'success', title: 'C', autoDismiss: false });

    expect(useNotificationStore.getState().unreadCount).toBe(3);

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    state.notifications.forEach((n) => expect(n.read).toBe(true));
  });

  it('should clear all notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'A', autoDismiss: false });
    addNotification({ type: 'info', title: 'B', autoDismiss: false });

    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should add notifications in reverse chronological order (newest first)', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', title: 'First', autoDismiss: false });
    addNotification({ type: 'info', title: 'Second', autoDismiss: false });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].title).toBe('Second');
    expect(state.notifications[1].title).toBe('First');
  });

  it('should enforce max 100 notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    for (let i = 0; i < 110; i++) {
      addNotification({ type: 'info', title: `Notif ${i}`, autoDismiss: false });
    }

    const state = useNotificationStore.getState();
    expect(state.notifications.length).toBeLessThanOrEqual(100);
  });

  it('should store optional message', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      autoDismiss: false,
    });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].message).toBe('Something went wrong');
  });

  it('should support all notification types', () => {
    const { addNotification } = useNotificationStore.getState();
    const types = ['info', 'success', 'warning', 'error'] as const;

    types.forEach((type) => {
      addNotification({ type, title: `Type: ${type}`, autoDismiss: false });
    });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(4);
  });

  it('should auto-dismiss notifications after specified time', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'info',
      title: 'Auto dismiss',
      autoDismiss: true,
      dismissAfterMs: 3000,
    });

    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    vi.advanceTimersByTime(3001);

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it('should not auto-dismiss when autoDismiss is false', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'error',
      title: 'Persistent',
      autoDismiss: false,
    });

    vi.advanceTimersByTime(10000);

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('should handle action property', () => {
    const mockFn = vi.fn();
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'info',
      title: 'With action',
      autoDismiss: false,
      action: { label: 'Retry', onClick: mockFn },
    });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].action?.label).toBe('Retry');
    state.notifications[0].action?.onClick();
    expect(mockFn).toHaveBeenCalled();
  });
});
