/**
 * @module use-performance
 * @description Performance optimization hooks for CodeForge IDE.
 * Provides reusable hooks for debouncing, throttling, and memoization
 * to improve rendering performance across the application.
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Custom hook that returns a debounced version of the provided callback.
 * The debounced function delays invoking the callback until after the
 * specified delay has elapsed since the last invocation.
 *
 * Useful for search input, window resize, and other high-frequency events.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds before the callback is invoked
 * @returns A debounced version of the callback
 *
 * @example
 * ```typescript
 * const debouncedSearch = useDebounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // In an input handler:
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<T>(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Custom hook that returns a throttled version of the provided callback.
 * The throttled function only invokes the callback at most once per
 * specified time limit.
 *
 * Useful for scroll events, mouse move handlers, and other continuous events.
 *
 * @param callback - The function to throttle
 * @param limit - Minimum time in milliseconds between invocations
 * @returns A throttled version of the callback
 *
 * @example
 * ```typescript
 * const throttledScroll = useThrottle((event: ScrollEvent) => {
 *   updateScrollPosition(event);
 * }, 100);
 *
 * // In a scroll handler:
 * <div onScroll={throttledScroll} />
 * ```
 */
export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef<T>(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      }
    },
    [limit]
  );
}

/**
 * Custom hook that returns a memoized copy of the provided array data.
 * Prevents unnecessary re-renders when the file tree data hasn't changed.
 *
 * @param data - The array data to memoize
 * @param key - A unique key that triggers recomputation when changed
 * @returns Memoized copy of the data array
 *
 * @example
 * ```typescript
 * const memoizedFiles = useMemoizedFileTree(fileNodes, fileTreeVersion);
 * ```
 */
export function useMemoizedFileTree<T>(data: T[], key: string | number): T[] {
  return useMemo(() => [...data], [data, key]);
}
