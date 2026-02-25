'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with dark theme
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-[#1e1e1e] p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Something went wrong
            </h2>
            <p className="max-w-md text-sm text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Collapsible stack trace */}
          {this.state.error?.stack && (
            <details className="mb-6 w-full max-w-lg">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                View error details
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-[#252526] p-3 text-xs text-gray-400">
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e]"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
