/**
 * API Error Handling Utilities
 * Provides structured error handling for API requests
 */

import { showErrorToast } from './toast';

/**
 * Custom API Error class with additional context
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      endpoint: this.endpoint,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Network Error class for connection issues
 */
export class NetworkError extends Error {
  constructor(message: string, public endpoint: string) {
    super(message);
    this.name = 'NetworkError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Timeout Error class
 */
export class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message);
    this.name = 'TimeoutError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**
 * Handle API response errors and throw appropriate error types
 */
export async function handleAPIError(
  response: Response,
  showToast = true
): Promise<never> {
  const status = response.status;
  const endpoint = response.url;

  // Try to parse error details from response
  let details: any;
  try {
    details = await response.json();
  } catch {
    // Response body might not be JSON
    details = await response.text();
  }

  let message: string;
  let error: APIError;

  switch (status) {
    case 400:
      message = 'Bad request. Please check your input.';
      error = new APIError(message, 400, endpoint, details);
      break;

    case 401:
      message = 'Authentication required. Please sign in.';
      error = new APIError(message, 401, endpoint, details);
      break;

    case 403:
      message = 'Access forbidden. You do not have permission.';
      error = new APIError(message, 403, endpoint, details);
      break;

    case 404:
      message = 'Resource not found.';
      error = new APIError(message, 404, endpoint, details);
      break;

    case 409:
      message = 'Conflict. Resource already exists or state conflict.';
      error = new APIError(message, 409, endpoint, details);
      break;

    case 422:
      message = 'Validation failed. Please check your input.';
      error = new APIError(message, 422, endpoint, details);
      break;

    case 429:
      message = 'Rate limit exceeded. Please try again later.';
      error = new APIError(message, 429, endpoint, details);
      break;

    case 500:
      message = 'Server error. Please try again later.';
      error = new APIError(message, 500, endpoint, details);
      break;

    case 502:
      message = 'Bad gateway. Service temporarily unavailable.';
      error = new APIError(message, 502, endpoint, details);
      break;

    case 503:
      message = 'Service unavailable. Please try again later.';
      error = new APIError(message, 503, endpoint, details);
      break;

    case 504:
      message = 'Gateway timeout. Request took too long.';
      error = new APIError(message, 504, endpoint, details);
      break;

    default:
      message = `Request failed with status ${status}`;
      error = new APIError(message, status, endpoint, details);
  }

  if (showToast) {
    showErrorToast(message);
  }

  console.error('API Error:', error.toJSON());
  throw error;
}

/**
 * Handle network errors (no response received)
 */
export function handleNetworkError(error: any, endpoint: string, showToast = true): never {
  const message = 'Network error. Please check your connection.';
  const networkError = new NetworkError(message, endpoint);

  if (showToast) {
    showErrorToast(message);
  }

  console.error('Network Error:', { error, endpoint });
  throw networkError;
}

/**
 * Handle timeout errors
 */
export function handleTimeoutError(timeout: number, showToast = true): never {
  const message = `Request timed out after ${timeout}ms`;
  const timeoutError = new TimeoutError(message, timeout);

  if (showToast) {
    showErrorToast(message);
  }

  console.error('Timeout Error:', timeoutError);
  throw timeoutError;
}

/**
 * Wrapper for fetch with automatic error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
  config?: {
    timeout?: number;
    showToast?: boolean;
  }
): Promise<Response> {
  const timeout = config?.timeout ?? 30000; // 30s default
  const showToast = config?.showToast ?? true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await handleAPIError(response, showToast);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      handleTimeoutError(timeout, showToast);
    }

    if (error instanceof APIError) {
      throw error;
    }

    handleNetworkError(error, url, showToast);
  }
}

/**
 * Type guard to check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Type guard to check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard to check if error is a TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Get user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof TimeoutError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
