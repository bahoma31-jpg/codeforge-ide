/**
 * Git Status Calculator
 * 
 * Provides utilities for determining file status and visual indicators
 * for Git operations.
 * 
 * @module lib/git/status
 */

export type FileStatus = 
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'unchanged'
  | 'conflicted';

/**
 * Determine file status by comparing local and remote versions
 * 
 * @param localFile - Local file content (null if doesn't exist locally)
 * @param remoteFile - Remote file content (null if doesn't exist remotely)
 * @param localPath - Local file path
 * @param remotePath - Remote file path (different if renamed)
 * @returns FileStatus
 * 
 * @example
 * ```ts
 * const status = getFileStatus('new content', 'old content', 'file.ts', 'file.ts');
 * // Returns: 'modified'
 * ```
 */
export function getFileStatus(
  localFile: string | null,
  remoteFile: string | null,
  localPath?: string,
  remotePath?: string
): FileStatus {
  try {
    // File doesn't exist locally but exists remotely = deleted
    if (localFile === null && remoteFile !== null) {
      return 'deleted';
    }

    // File exists locally but not remotely = added
    if (localFile !== null && remoteFile === null) {
      return 'added';
    }

    // Both null = unchanged (shouldn't happen)
    if (localFile === null && remoteFile === null) {
      return 'unchanged';
    }

    // Check if file was renamed
    if (localPath && remotePath && localPath !== remotePath) {
      return 'renamed';
    }

    // Compare content
    if (localFile !== remoteFile) {
      return 'modified';
    }

    // Content is identical
    return 'unchanged';
  } catch (error) {
    console.error('Error determining file status:', error);
    return 'unchanged';
  }
}

/**
 * Get Git status icon for file
 * 
 * @param status - File status
 * @returns Single character icon (M, A, D, R, U, C)
 * 
 * @example
 * ```ts
 * const icon = getStatusIcon('modified'); // Returns: 'M'
 * const icon = getStatusIcon('added');    // Returns: 'A'
 * ```
 */
export function getStatusIcon(status: FileStatus): string {
  const icons: Record<FileStatus, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    unchanged: 'U',
    conflicted: 'C'
  };

  return icons[status] || 'U';
}

/**
 * Get color for file status (hex code)
 * 
 * @param status - File status
 * @returns Hex color code
 * 
 * @example
 * ```ts
 * const color = getStatusColor('modified'); // Returns: '#FFA500' (orange)
 * const color = getStatusColor('added');    // Returns: '#00FF00' (green)
 * ```
 */
export function getStatusColor(status: FileStatus): string {
  const colors: Record<FileStatus, string> = {
    modified: '#FFA500', // Orange
    added: '#00FF00',    // Green
    deleted: '#FF0000',  // Red
    renamed: '#00BFFF',  // Deep Sky Blue
    unchanged: '#808080', // Gray
    conflicted: '#FF00FF' // Magenta
  };

  return colors[status] || colors.unchanged;
}

/**
 * Get Tailwind CSS class for file status
 * 
 * @param status - File status
 * @returns Tailwind color class
 * 
 * @example
 * ```ts
 * const className = getStatusColorClass('modified');
 * // Returns: 'text-orange-500'
 * ```
 */
export function getStatusColorClass(status: FileStatus): string {
  const classes: Record<FileStatus, string> = {
    modified: 'text-orange-500',
    added: 'text-green-500',
    deleted: 'text-red-500',
    renamed: 'text-blue-500',
    unchanged: 'text-gray-500',
    conflicted: 'text-pink-500'
  };

  return classes[status] || classes.unchanged;
}

/**
 * Get human-readable status description
 * 
 * @param status - File status
 * @returns Human-readable description
 * 
 * @example
 * ```ts
 * const desc = getStatusDescription('modified');
 * // Returns: 'Modified'
 * ```
 */
export function getStatusDescription(status: FileStatus): string {
  const descriptions: Record<FileStatus, string> = {
    modified: 'Modified',
    added: 'Added',
    deleted: 'Deleted',
    renamed: 'Renamed',
    unchanged: 'Unchanged',
    conflicted: 'Conflicted'
  };

  return descriptions[status] || descriptions.unchanged;
}

/**
 * Check if file status indicates changes
 * 
 * @param status - File status
 * @returns True if file has changes
 * 
 * @example
 * ```ts
 * hasChanges('modified'); // true
 * hasChanges('unchanged'); // false
 * ```
 */
export function hasChanges(status: FileStatus): boolean {
  return status !== 'unchanged';
}

/**
 * Check if file status can be staged
 * 
 * @param status - File status
 * @returns True if file can be staged
 * 
 * @example
 * ```ts
 * canBeStaged('modified'); // true
 * canBeStaged('unchanged'); // false
 * canBeStaged('conflicted'); // false
 * ```
 */
export function canBeStaged(status: FileStatus): boolean {
  return status !== 'unchanged' && status !== 'conflicted';
}

/**
 * Get status priority for sorting (lower = higher priority)
 * 
 * @param status - File status
 * @returns Priority number (1-6)
 * 
 * @example
 * ```ts
 * // Sort files by status priority
 * files.sort((a, b) => 
 *   getStatusPriority(a.status) - getStatusPriority(b.status)
 * );
 * ```
 */
export function getStatusPriority(status: FileStatus): number {
  const priorities: Record<FileStatus, number> = {
    conflicted: 1, // Highest priority
    modified: 2,
    added: 3,
    renamed: 4,
    deleted: 5,
    unchanged: 6  // Lowest priority
  };

  return priorities[status] || 6;
}
