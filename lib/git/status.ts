/**
 * CodeForge IDE - Git Status Calculator
 * Agent 5: GitHub Integration
 * 
 * Calculates file status (modified, added, deleted, renamed, unchanged)
 * and provides UI helpers (icons, colors)
 */

import { FileNode } from '../db/schema';

/**
 * File status types
 */
export type FileStatus = 
  | 'modified'    // M - File modified
  | 'added'       // A - File added (new)
  | 'deleted'     // D - File deleted
  | 'renamed'     // R - File renamed/moved
  | 'unchanged'   // - - No changes
  | 'untracked';  // U - Not tracked by git

/**
 * File status result
 */
export interface FileStatusResult {
  path: string;
  status: FileStatus;
  oldPath?: string;        // For renamed files
  additions?: number;      // Lines added
  deletions?: number;      // Lines deleted
}

/**
 * Compare two file contents to determine status
 * 
 * @param localFile - Current local file
 * @param remoteFile - File from last commit (or undefined if new)
 * @returns File status
 */
export function getFileStatus(
  localFile: FileNode | undefined,
  remoteFile: FileNode | undefined
): FileStatus {
  // File exists locally but not remotely - added
  if (localFile && !remoteFile) {
    return 'added';
  }

  // File exists remotely but not locally - deleted
  if (!localFile && remoteFile) {
    return 'deleted';
  }

  // File exists in both - check if modified
  if (localFile && remoteFile) {
    // Compare content
    if (localFile.content !== remoteFile.content) {
      return 'modified';
    }

    // Check if renamed (path changed)
    if (localFile.path !== remoteFile.path) {
      return 'renamed';
    }

    return 'unchanged';
  }

  return 'unchanged';
}

/**
 * Get status for multiple files
 * 
 * @param localFiles - Current local files
 * @param remoteFiles - Files from last commit
 * @returns Array of file status results
 */
export function getFilesStatus(
  localFiles: FileNode[],
  remoteFiles: FileNode[]
): FileStatusResult[] {
  const results: FileStatusResult[] = [];
  const remoteMap = new Map(remoteFiles.map(f => [f.path, f]));
  const localMap = new Map(localFiles.map(f => [f.path, f]));

  // Check all local files
  for (const localFile of localFiles) {
    if (localFile.type === 'folder') continue;

    const remoteFile = remoteMap.get(localFile.path);
    const status = getFileStatus(localFile, remoteFile);

    if (status !== 'unchanged') {
      results.push({
        path: localFile.path,
        status,
      });
    }
  }

  // Check for deleted files (in remote but not in local)
  for (const remoteFile of remoteFiles) {
    if (remoteFile.type === 'folder') continue;

    if (!localMap.has(remoteFile.path)) {
      results.push({
        path: remoteFile.path,
        status: 'deleted',
      });
    }
  }

  return results;
}

/**
 * Get status icon for UI display
 * 
 * @param status - File status
 * @returns Single character icon
 */
export function getStatusIcon(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return 'M';
    case 'added':
      return 'A';
    case 'deleted':
      return 'D';
    case 'renamed':
      return 'R';
    case 'untracked':
      return 'U';
    case 'unchanged':
      return '-';
    default:
      return '?';
  }
}

/**
 * Get status color for UI display
 * 
 * @param status - File status
 * @returns Color (CSS color name or hex)
 */
export function getStatusColor(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return '#FFA500'; // Orange
    case 'added':
      return '#00FF00'; // Green
    case 'deleted':
      return '#FF0000'; // Red
    case 'renamed':
      return '#00BFFF'; // Deep Sky Blue
    case 'untracked':
      return '#808080'; // Gray
    case 'unchanged':
      return '#FFFFFF'; // White
    default:
      return '#FFFFFF';
  }
}

/**
 * Get status color for dark theme
 * 
 * @param status - File status
 * @returns Dark theme color
 */
export function getStatusColorDark(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return '#E5B567'; // Softer orange
    case 'added':
      return '#98C379'; // Softer green
    case 'deleted':
      return '#E06C75'; // Softer red
    case 'renamed':
      return '#61AFEF'; // Softer blue
    case 'untracked':
      return '#ABB2BF'; // Light gray
    case 'unchanged':
      return '#D4D4D4'; // Very light gray
    default:
      return '#D4D4D4';
  }
}

/**
 * Get status description for tooltips
 * 
 * @param status - File status
 * @returns Human-readable description
 */
export function getStatusDescription(status: FileStatus): string {
  switch (status) {
    case 'modified':
      return 'Modified';
    case 'added':
      return 'Added (new file)';
    case 'deleted':
      return 'Deleted';
    case 'renamed':
      return 'Renamed';
    case 'untracked':
      return 'Untracked';
    case 'unchanged':
      return 'No changes';
    default:
      return 'Unknown status';
  }
}

/**
 * Check if file should be shown in changes list
 * 
 * @param status - File status
 * @returns True if file has changes
 */
export function hasChanges(status: FileStatus): boolean {
  return status !== 'unchanged' && status !== 'untracked';
}

/**
 * Group files by status
 * 
 * @param files - Array of file status results
 * @returns Object with files grouped by status
 */
export function groupFilesByStatus(
  files: FileStatusResult[]
): Record<FileStatus, FileStatusResult[]> {
  const groups: Record<FileStatus, FileStatusResult[]> = {
    modified: [],
    added: [],
    deleted: [],
    renamed: [],
    unchanged: [],
    untracked: [],
  };

  for (const file of files) {
    groups[file.status].push(file);
  }

  return groups;
}

/**
 * Calculate simple line-based diff statistics
 * 
 * @param oldContent - Original content
 * @param newContent - Modified content
 * @returns Additions and deletions count
 */
export function calculateDiffStats(
  oldContent: string,
  newContent: string
): { additions: number; deletions: number; total: number } {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Count additions (lines in new but not in old)
  let additions = 0;
  for (const line of newLines) {
    if (!oldSet.has(line)) {
      additions++;
    }
  }

  // Count deletions (lines in old but not in new)
  let deletions = 0;
  for (const line of oldLines) {
    if (!newSet.has(line)) {
      deletions++;
    }
  }

  return {
    additions,
    deletions,
    total: additions + deletions,
  };
}

/**
 * Check if path should be ignored by git
 * (Basic implementation - checks common patterns)
 * 
 * @param path - File path
 * @returns True if file should be ignored
 */
export function shouldIgnoreFile(path: string): boolean {
  const ignorePatterns = [
    /node_modules\//,
    /\.git\//,
    /\.next\//,
    /dist\//,
    /build\//,
    /\.env/,
    /\.DS_Store/,
    /\.log$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
  ];

  return ignorePatterns.some(pattern => pattern.test(path));
}
