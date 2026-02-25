'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Debounce hook for search, resize, and other frequent events.
 * Uses useRef + useCallback for stable reference.
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<T>(callback);

  // Update callback ref on each render
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

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as unknown as T;

  return debouncedCallback;
}

/**
 * Throttle hook for scroll, mouse move, and other continuous events.
 * Only allows execution if enough time has passed since last call.
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef<T>(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= limit) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    },
    [limit]
  ) as unknown as T;

  return throttledCallback;
}

/**
 * Memoized file tree hook for expensive computations.
 * Returns memoized data based on provided dependencies.
 */
export function useMemoizedFileTree<T>(
  data: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedData = useMemo(() => data, deps);
  return memoizedData;
}
