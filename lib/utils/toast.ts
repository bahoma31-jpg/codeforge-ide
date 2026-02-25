/**
 * Toast Notification System
 * A lightweight, global toast notification manager
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  timestamp: number;
}

type ToastListener = (toasts: Toast[]) => void;

// Global state
let toasts: Toast[] = [];
let listeners: ToastListener[] = [];

/**
 * Generate a unique ID for each toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Notify all listeners of toast state changes
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener([...toasts]));
}

/**
 * Add a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration = 3000
): string {
  const id = generateId();
  const toast: Toast = {
    id,
    type,
    message,
    duration,
    timestamp: Date.now(),
  };

  toasts = [...toasts, toast];
  notifyListeners();

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

/**
 * Remove a specific toast by ID
 */
export function removeToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  notifyListeners();
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  toasts = [];
  notifyListeners();
}

/**
 * Subscribe to toast updates
 */
export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.push(listener);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Get current toasts (for SSR compatibility)
 */
export function getToasts(): Toast[] {
  return [...toasts];
}

// Convenience methods for different toast types

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, duration = 3000): string {
  return showToast(message, 'success', duration);
}

/**
 * Show an error toast (longer duration by default)
 */
export function showErrorToast(message: string, duration = 5000): string {
  return showToast(message, 'error', duration);
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, duration = 4000): string {
  return showToast(message, 'warning', duration);
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, duration = 3000): string {
  return showToast(message, 'info', duration);
}

/**
 * Show a loading toast (doesn't auto-dismiss)
 */
export function showLoadingToast(message: string): string {
  return showToast(message, 'info', 0);
}

/**
 * Update an existing toast
 */
export function updateToast(
  id: string,
  message: string,
  type?: ToastType
): void {
  const toastIndex = toasts.findIndex((t) => t.id === id);
  if (toastIndex !== -1) {
    toasts[toastIndex] = {
      ...toasts[toastIndex],
      message,
      ...(type && { type }),
    };
    notifyListeners();
  }
}

/**
 * Promise-based toast for async operations
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  const loadingId = showLoadingToast(messages.loading);

  try {
    const result = await promise;
    removeToast(loadingId);

    const successMessage =
      typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success;
    showSuccessToast(successMessage);

    return result;
  } catch (error) {
    removeToast(loadingId);

    const errorMessage =
      typeof messages.error === 'function'
        ? messages.error(error as Error)
        : messages.error;
    showErrorToast(errorMessage);

    throw error;
  }
}
