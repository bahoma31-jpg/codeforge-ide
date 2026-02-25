/**
 * @module ErrorBoundary
 * @description Global error boundary component for catching and displaying
 * runtime errors gracefully in the CodeForge IDE application.
 * Prevents the entire app from crashing when a component throws an error.
 */
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/** Props for the ErrorBoundary component */
interface ErrorBoundaryProps {
  /** Child components to wrap with error handling */
  children: ReactNode;
  /** Optional custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
}

/** Internal state for the ErrorBoundary component */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error object, if any */
  error: Error | null;
}

/**
 * React Error Boundary component that catches JavaScript errors in its child
 * component tree, logs those errors, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * // Basic usage:
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback:
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is thrown by a child component.
   * @param error - The error that was thrown
   * @returns Updated state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error information for debugging purposes.
   * @param error - The error that was thrown
   * @param errorInfo - React component stack trace information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[CodeForge Error Boundary]:', error, errorInfo);
  }

  /** Reset the error state to allow retry */
  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-3 text-red-400">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-400 mb-2">
              An unexpected error occurred in the application.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs text-gray-500 bg-[#2d2d2d] rounded p-3 mb-4 overflow-auto max-h-24 text-left">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
