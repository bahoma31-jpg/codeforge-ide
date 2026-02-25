/**
 * CodeForge IDE - Status Calculator
 * Agent 5: Phase 2 - Task 5
 * 
 * Git status utilities
 */

/**
 * File status type
 */
export type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'unchanged';

/**
 * Get file status by comparing local and remote versions
 * 
 * @param localFile - Local file content (null if doesn't exist)
 * @param remoteFile - Remote file content (null if doesn't exist)
 * @returns File status
 */
export function getFileStatus(
  localFile: { path: string; content: string } | null,
  remoteFile: { path: string; content: string } | null
): FileStatus {
  // Both missing - shouldn't happen
  if (!localFile && !remoteFile) {
    return 'unchanged';
  }

  // File added
  if (localFile && !remoteFile) {
    return 'added';
  }

  // File deleted
  if (!localFile && remoteFile) {
    return 'deleted';
  }

  // Both exist
  if (localFile && remoteFile) {
    // Check if paths differ (renamed)
    if (localFile.path !== remoteFile.path) {
      return 'renamed';
    }

    // Check if content differs (modified)
    if (localFile.content !== remoteFile.content) {
      return 'modified';
    }

    // Unchanged
    return 'unchanged';
  }

  return 'unchanged';
}

/**
 * Get short status code (Git-style)
 * 
 * @param status - File status
 * @returns Single or double character code
 */
export function getStatusCode(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return 'M';
    case 'added':
      return 'A';
    case 'deleted':
      return 'D';
    case 'renamed':
      return 'R';
    case 'unchanged':
      return ' ';
    default:
      return '?';
  }
}

/**
 * Get status icon (emoji)
 * 
 * @param status - File status
 * @returns Icon string
 */
export function getStatusIcon(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return '●'; // Filled circle
    case 'added':
      return '+';
    case 'deleted':
      return '-';
    case 'renamed':
      return '→';
    case 'unchanged':
      return '';
    default:
      return '?';
  }
}

/**
 * Get status color (for UI)
 * 
 * @param status - File status
 * @returns CSS color value
 */
export function getStatusColor(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return '#e2b93d'; // Yellow/Gold
    case 'added':
      return '#73c991'; // Green
    case 'deleted':
      return '#e68a88'; // Red
    case 'renamed':
      return '#8db9f5'; // Blue
    case 'unchanged':
      return '#8c939f'; // Gray
    default:
      return '#8c939f';
  }
}

/**
 * Get human-readable status description
 * 
 * @param status - File status
 * @returns Description string
 */
export function getStatusDescription(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return 'Modified';
    case 'added':
      return 'Added';
    case 'deleted':
      return 'Deleted';
    case 'renamed':
      return 'Renamed';
    case 'unchanged':
      return 'Unchanged';
    default:
      return 'Unknown';
  }
}

/**
 * Check if file has changes
 * 
 * @param status - File status
 * @returns True if file has changes
 */
export function hasChanges(status: FileStatus): boolean {
  return status !== 'unchanged';
}

/**
 * Get status summary from file list
 * 
 * @param files - Array of files with status
 * @returns Summary object
 */
export function getStatusSummary(files: Array<{ status: FileStatus }>): {
  modified: number;
  added: number;
  deleted: number;
  renamed: number;
  unchanged: number;
  total: number;
} {
  const summary = {
    modified: 0,
    added: 0,
    deleted: 0,
    renamed: 0,
    unchanged: 0,
    total: files.length
  };

  for (const file of files) {
    switch (file.status) {
      case 'modified':
        summary.modified++;
        break;
      case 'added':
        summary.added++;
        break;
      case 'deleted':
        summary.deleted++;
        break;
      case 'renamed':
        summary.renamed++;
        break;
      case 'unchanged':
        summary.unchanged++;
        break;
    }
  }

  return summary;
}

/**
 * Format status summary as string
 * 
 * @param summary - Status summary object
 * @returns Formatted string
 */
export function formatStatusSummary(summary: ReturnType<typeof getStatusSummary>): string {
  const parts: string[] = [];

  if (summary.added > 0) {
    parts.push(`${summary.added} added`);
  }
  if (summary.modified > 0) {
    parts.push(`${summary.modified} modified`);
  }
  if (summary.deleted > 0) {
    parts.push(`${summary.deleted} deleted`);
  }
  if (summary.renamed > 0) {
    parts.push(`${summary.renamed} renamed`);
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return parts.join(', ');
}
