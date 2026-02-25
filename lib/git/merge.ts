/**
 * Git Merge Logic
 * 
 * Handles merging of file contents and conflict detection/resolution.
 * 
 * @module lib/git/merge
 */

import { calculateDiff, type DiffLine } from './diff';

/**
 * Conflict block in merged content
 */
export interface ConflictBlock {
  /** Starting line number of conflict */
  start: number;
  /** Ending line number of conflict */
  end: number;
  /** Local version lines */
  local: string[];
  /** Remote version lines */
  remote: string[];
}

/**
 * Result of conflict detection
 */
export interface ConflictResult {
  /** True if conflicts were detected */
  hasConflicts: boolean;
  /** Merged content (with conflict markers if conflicts exist) */
  mergedContent: string;
  /** Array of detected conflicts */
  conflicts: ConflictBlock[];
}

/**
 * Merge resolution strategy
 */
export type MergeResolution = 'local' | 'remote' | 'both';

/**
 * Detect conflicts between local and remote versions
 * 
 * @param localContent - Local file content
 * @param remoteContent - Remote file content
 * @param baseContent - Common ancestor content (optional)
 * @returns ConflictResult
 * 
 * @example
 * ```ts
 * const result = detectConflicts(
 *   'line 1\nlocal change\nline 3',
 *   'line 1\nremote change\nline 3'
 * );
 * // Returns: { hasConflicts: true, mergedContent: '...', conflicts: [...] }
 * ```
 */
export function detectConflicts(
  localContent: string,
  remoteContent: string,
  baseContent?: string
): ConflictResult {
  try {
    // If contents are identical, no conflict
    if (localContent === remoteContent) {
      return {
        hasConflicts: false,
        mergedContent: localContent,
        conflicts: []
      };
    }

    // If no base provided, use simple 3-way comparison
    if (!baseContent) {
      return simpleConflictDetection(localContent, remoteContent);
    }

    // Perform 3-way merge
    return threeWayMerge(baseContent, localContent, remoteContent);
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    // Return conflict result on error
    return {
      hasConflicts: true,
      mergedContent: formatConflictMarkers(localContent, remoteContent),
      conflicts: [{
        start: 0,
        end: localContent.split('\n').length,
        local: localContent.split('\n'),
        remote: remoteContent.split('\n')
      }]
    };
  }
}

/**
 * Simple conflict detection (no base content)
 * 
 * @param localContent - Local content
 * @param remoteContent - Remote content
 * @returns ConflictResult
 */
function simpleConflictDetection(
  localContent: string,
  remoteContent: string
): ConflictResult {
  const localLines = localContent.split('\n');
  const remoteLines = remoteContent.split('\n');
  const conflicts: ConflictBlock[] = [];
  const mergedLines: string[] = [];

  let localIdx = 0;
  let remoteIdx = 0;

  while (localIdx < localLines.length || remoteIdx < remoteLines.length) {
    const localLine = localLines[localIdx];
    const remoteLine = remoteLines[remoteIdx];

    // Both ended
    if (localIdx >= localLines.length && remoteIdx >= remoteLines.length) {
      break;
    }

    // Lines match
    if (localLine === remoteLine) {
      mergedLines.push(localLine);
      localIdx++;
      remoteIdx++;
      continue;
    }

    // Lines differ - mark as conflict
    const conflictStart = mergedLines.length;
    const localConflict: string[] = [];
    const remoteConflict: string[] = [];

    // Collect conflicting lines until we find matching lines again
    let foundMatch = false;
    while (!foundMatch && (localIdx < localLines.length || remoteIdx < remoteLines.length)) {
      if (localIdx < localLines.length) {
        localConflict.push(localLines[localIdx]);
      }
      if (remoteIdx < remoteLines.length) {
        remoteConflict.push(remoteLines[remoteIdx]);
      }

      localIdx++;
      remoteIdx++;

      // Check if next lines match
      if (localIdx < localLines.length && remoteIdx < remoteLines.length) {
        if (localLines[localIdx] === remoteLines[remoteIdx]) {
          foundMatch = true;
        }
      }

      // Limit conflict block size
      if (localConflict.length > 50) break;
    }

    // Add conflict markers
    mergedLines.push('<<<<<<< LOCAL');
    mergedLines.push(...localConflict);
    mergedLines.push('=======');
    mergedLines.push(...remoteConflict);
    mergedLines.push('>>>>>>> REMOTE');

    conflicts.push({
      start: conflictStart,
      end: mergedLines.length - 1,
      local: localConflict,
      remote: remoteConflict
    });
  }

  return {
    hasConflicts: conflicts.length > 0,
    mergedContent: mergedLines.join('\n'),
    conflicts
  };
}

/**
 * Three-way merge using base content
 * 
 * @param baseContent - Common ancestor
 * @param localContent - Local changes
 * @param remoteContent - Remote changes
 * @returns ConflictResult
 */
function threeWayMerge(
  baseContent: string,
  localContent: string,
  remoteContent: string
): ConflictResult {
  const baseLines = baseContent.split('\n');
  const localLines = localContent.split('\n');
  const remoteLines = remoteContent.split('\n');

  const localDiff = calculateDiff(baseContent, localContent);
  const remoteDiff = calculateDiff(baseContent, remoteContent);

  // If no changes in local, accept remote
  if (!localDiff.hasChanges) {
    return {
      hasConflicts: false,
      mergedContent: remoteContent,
      conflicts: []
    };
  }

  // If no changes in remote, accept local
  if (!remoteDiff.hasChanges) {
    return {
      hasConflicts: false,
      mergedContent: localContent,
      conflicts: []
    };
  }

  // Both have changes - detect conflicts
  // For simplicity, if both changed, mark as conflict
  const conflicts: ConflictBlock[] = [{
    start: 0,
    end: Math.max(localLines.length, remoteLines.length),
    local: localLines,
    remote: remoteLines
  }];

  return {
    hasConflicts: true,
    mergedContent: formatConflictMarkers(localContent, remoteContent),
    conflicts
  };
}

/**
 * Format content with conflict markers
 * 
 * @param localContent - Local content
 * @param remoteContent - Remote content
 * @returns Content with conflict markers
 */
function formatConflictMarkers(localContent: string, remoteContent: string): string {
  return [
    '<<<<<<< LOCAL',
    localContent,
    '=======',
    remoteContent,
    '>>>>>>> REMOTE'
  ].join('\n');
}

/**
 * Resolve a conflict using specified strategy
 * 
 * @param conflict - ConflictBlock to resolve
 * @param resolution - Resolution strategy
 * @returns Resolved content
 * 
 * @example
 * ```ts
 * const resolved = resolveConflict(conflict, 'local');
 * // Returns content from local version
 * ```
 */
export function resolveConflict(
  conflict: ConflictBlock,
  resolution: MergeResolution
): string {
  try {
    switch (resolution) {
      case 'local':
        return conflict.local.join('\n');

      case 'remote':
        return conflict.remote.join('\n');

      case 'both':
        // Combine both versions
        return [...conflict.local, ...conflict.remote].join('\n');

      default:
        return conflict.local.join('\n');
    }
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return conflict.local.join('\n');
  }
}

/**
 * Resolve all conflicts in merged content
 * 
 * @param mergedContent - Content with conflict markers
 * @param resolution - Resolution strategy
 * @returns Fully resolved content
 * 
 * @example
 * ```ts
 * const resolved = resolveAllConflicts(conflictedContent, 'local');
 * // Returns content with all conflicts resolved to local version
 * ```
 */
export function resolveAllConflicts(
  mergedContent: string,
  resolution: MergeResolution
): string {
  try {
    const lines = mergedContent.split('\n');
    const resolved: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Found conflict marker
      if (line.startsWith('<<<<<<< ')) {
        const localLines: string[] = [];
        const remoteLines: string[] = [];
        i++;

        // Collect local lines
        while (i < lines.length && !lines[i].startsWith('=======')) {
          localLines.push(lines[i]);
          i++;
        }
        i++; // Skip =======

        // Collect remote lines
        while (i < lines.length && !lines[i].startsWith('>>>>>>> ')) {
          remoteLines.push(lines[i]);
          i++;
        }
        i++; // Skip >>>>>>>

        // Resolve conflict
        const conflict: ConflictBlock = {
          start: resolved.length,
          end: resolved.length,
          local: localLines,
          remote: remoteLines
        };

        const resolvedContent = resolveConflict(conflict, resolution);
        resolved.push(resolvedContent);
      } else {
        resolved.push(line);
        i++;
      }
    }

    return resolved.join('\n');
  } catch (error) {
    console.error('Error resolving all conflicts:', error);
    return mergedContent;
  }
}

/**
 * Check if content has conflict markers
 * 
 * @param content - Content to check
 * @returns True if conflict markers found
 * 
 * @example
 * ```ts
 * hasConflictMarkers('normal content'); // false
 * hasConflictMarkers('<<<<<<< LOCAL\nconflict\n>>>>>> REMOTE'); // true
 * ```
 */
export function hasConflictMarkers(content: string): boolean {
  return /^<{7} |^={7}$|^>{7} /m.test(content);
}

/**
 * Count number of conflicts in content
 * 
 * @param content - Content with conflict markers
 * @returns Number of conflicts
 */
export function countConflicts(content: string): number {
  const matches = content.match(/^<{7} /gm);
  return matches ? matches.length : 0;
}
