/**
 * Git Operation Error Handling
 * Handles various Git operation errors with user-friendly messages
 */

import { showErrorToast, showWarningToast } from './toast';

/**
 * Git-specific error types
 */
export class GitError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GitError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GitError);
    }
  }
}

export class MergeConflictError extends GitError {
  constructor(
    message: string,
    public conflictFiles: string[]
  ) {
    super(message, 'MERGE_CONFLICT', { conflictFiles });
    this.name = 'MergeConflictError';
  }
}

export class AuthenticationError extends GitError {
  constructor(message: string) {
    super(message, 'AUTH_FAILED');
    this.name = 'AuthenticationError';
  }
}

export class PushRejectedError extends GitError {
  constructor(
    message: string,
    public reason: 'non-fast-forward' | 'protected-branch' | 'unknown'
  ) {
    super(message, 'PUSH_REJECTED', { reason });
    this.name = 'PushRejectedError';
  }
}

export class InvalidGitStateError extends GitError {
  constructor(message: string) {
    super(message, 'INVALID_STATE');
    this.name = 'InvalidGitStateError';
  }
}

export class NetworkError extends GitError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Parse Git error messages and throw appropriate error types
 */
export function parseGitError(error: any): GitError {
  const message = error.message || String(error);
  const lowerMessage = message.toLowerCase();

  // Merge conflicts
  if (
    lowerMessage.includes('merge conflict') ||
    lowerMessage.includes('conflict') ||
    lowerMessage.includes('unmerged')
  ) {
    const files = extractConflictFiles(message);
    return new MergeConflictError(
      'Merge conflicts detected. Resolve conflicts before continuing.',
      files
    );
  }

  // Authentication failures
  if (
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('unauthorized')
  ) {
    return new AuthenticationError(
      'Authentication failed. Please check your credentials.'
    );
  }

  // Push rejected
  if (
    lowerMessage.includes('push rejected') ||
    lowerMessage.includes('non-fast-forward') ||
    lowerMessage.includes('fetch first')
  ) {
    const reason = lowerMessage.includes('protected')
      ? 'protected-branch'
      : lowerMessage.includes('non-fast-forward')
      ? 'non-fast-forward'
      : 'unknown';

    return new PushRejectedError(
      'Push rejected. Pull the latest changes first.',
      reason
    );
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('unreachable')
  ) {
    return new NetworkError(
      'Network error. Check your internet connection.'
    );
  }

  // Invalid Git state
  if (
    lowerMessage.includes('not a git repository') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('corrupt')
  ) {
    return new InvalidGitStateError(
      'Invalid Git repository state.'
    );
  }

  // Generic Git error
  return new GitError(message, 'UNKNOWN');
}

/**
 * Extract conflict file names from Git error message
 */
function extractConflictFiles(message: string): string[] {
  const files: string[] = [];
  const lines = message.split('\n');

  for (const line of lines) {
    // Match patterns like "CONFLICT (content): Merge conflict in file.txt"
    const match = line.match(/CONFLICT.*in (.+)/);
    if (match) {
      files.push(match[1].trim());
    }
  }

  return files;
}

/**
 * Handle Git operation errors with appropriate user feedback
 */
export function handleGitError(error: any, operation: string): never {
  const gitError = error instanceof GitError ? error : parseGitError(error);

  console.error(`Git ${operation} error:`, gitError);

  // Show appropriate toast notification
  if (gitError instanceof MergeConflictError) {
    showErrorToast(
      `Merge conflicts in ${gitError.conflictFiles.length} file(s). Resolve conflicts first.`
    );
  } else if (gitError instanceof AuthenticationError) {
    showErrorToast('Authentication failed. Please reconnect to GitHub.');
  } else if (gitError instanceof PushRejectedError) {
    if (gitError.reason === 'protected-branch') {
      showErrorToast('Push rejected: Branch is protected.');
    } else {
      showWarningToast('Pull latest changes before pushing.');
    }
  } else if (gitError instanceof NetworkError) {
    showErrorToast('Network error. Check your connection and try again.');
  } else if (gitError instanceof InvalidGitStateError) {
    showErrorToast('Invalid Git state. Repository may be corrupted.');
  } else {
    showErrorToast(`Git ${operation} failed: ${gitError.message}`);
  }

  throw gitError;
}

/**
 * Get user-friendly message for Git errors
 */
export function getGitErrorMessage(error: GitError): string {
  if (error instanceof MergeConflictError) {
    return `Merge conflicts in ${error.conflictFiles.length} file(s): ${error.conflictFiles.join(', ')}`;
  }

  if (error instanceof AuthenticationError) {
    return 'Authentication failed. Please check your GitHub credentials.';
  }

  if (error instanceof PushRejectedError) {
    if (error.reason === 'protected-branch') {
      return 'Push rejected: This branch is protected and requires pull request.';
    }
    if (error.reason === 'non-fast-forward') {
      return 'Push rejected: Remote contains work you do not have. Pull first.';
    }
    return 'Push rejected. Check repository settings.';
  }

  if (error instanceof NetworkError) {
    return 'Network error. Please check your internet connection.';
  }

  if (error instanceof InvalidGitStateError) {
    return 'Git repository is in an invalid state.';
  }

  return error.message;
}

/**
 * Get suggested actions for Git errors
 */
export function getGitErrorActions(error: GitError): string[] {
  if (error instanceof MergeConflictError) {
    return [
      'Open the files with conflicts',
      'Resolve conflicts manually',
      'Mark conflicts as resolved',
      'Complete the merge with a commit',
    ];
  }

  if (error instanceof AuthenticationError) {
    return [
      'Reconnect to GitHub',
      'Check your personal access token',
      'Verify repository permissions',
    ];
  }

  if (error instanceof PushRejectedError) {
    if (error.reason === 'non-fast-forward') {
      return [
        'Pull the latest changes from remote',
        'Resolve any merge conflicts',
        'Try pushing again',
      ];
    }
    if (error.reason === 'protected-branch') {
      return [
        'Create a pull request instead',
        'Push to a different branch',
        'Contact repository admin',
      ];
    }
    return ['Check repository settings', 'Verify branch permissions'];
  }

  if (error instanceof NetworkError) {
    return [
      'Check your internet connection',
      'Verify GitHub is accessible',
      'Try again in a few moments',
    ];
  }

  if (error instanceof InvalidGitStateError) {
    return [
      'Check repository integrity',
      'Consider re-cloning the repository',
      'Contact support if issue persists',
    ];
  }

  return ['Check error details', 'Try the operation again'];
}

/**
 * Type guards
 */
export function isMergeConflictError(error: unknown): error is MergeConflictError {
  return error instanceof MergeConflictError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isPushRejectedError(error: unknown): error is PushRejectedError {
  return error instanceof PushRejectedError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isInvalidGitStateError(error: unknown): error is InvalidGitStateError {
  return error instanceof InvalidGitStateError;
}
