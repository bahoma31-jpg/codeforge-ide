/**
 * CodeForge IDE - Merge Logic
 * Agent 5: Phase 2 - Task 6
 * 
 * Merge and conflict detection
 */

import { calculateDiff, type DiffLine } from './diff';

/**
 * Conflict block in merge result
 */
export interface ConflictBlock {
  start: number; // Starting line number
  end: number; // Ending line number
  local: string[]; // Lines from local version
  remote: string[]; // Lines from remote version
}

/**
 * Merge result
 */
export interface ConflictResult {
  hasConflicts: boolean;
  mergedContent: string;
  conflicts: ConflictBlock[];
}

/**
 * Conflict resolution strategy
 */
export type ResolutionStrategy = 'local' | 'remote' | 'both';

/**
 * Detect conflicts between local and remote content
 * 
 * Simple 3-way merge simulation
 * 
 * @param localContent - Local file content
 * @param remoteContent - Remote file content
 * @param baseContent - Common ancestor content (optional)
 * @returns Conflict result
 */
export function detectConflicts(
  localContent: string,
  remoteContent: string,
  baseContent?: string
): ConflictResult {
  const localLines = localContent.split('\n');
  const remoteLines = remoteContent.split('\n');
  const baseLines = baseContent ? baseContent.split('\n') : [];

  // If no base, do simple 2-way comparison
  if (!baseContent) {
    return detectTwoWayConflicts(localLines, remoteLines);
  }

  // 3-way merge
  return detectThreeWayConflicts(localLines, remoteLines, baseLines);
}

/**
 * Detect conflicts using 2-way comparison
 */
function detectTwoWayConflicts(
  localLines: string[],
  remoteLines: string[]
): ConflictResult {
  const conflicts: ConflictBlock[] = [];
  const mergedLines: string[] = [];
  let hasConflicts = false;

  const diff = calculateDiff(localLines.join('\n'), remoteLines.join('\n'));

  let localIndex = 0;
  let remoteIndex = 0;
  let lineNumber = 0;

  for (const hunk of diff.hunks) {
    // Add unchanged lines before hunk
    while (localIndex < hunk.oldStart - 1) {
      mergedLines.push(localLines[localIndex]);
      localIndex++;
      remoteIndex++;
      lineNumber++;
    }

    // Check if hunk has conflicts
    const hasAdds = hunk.lines.some(l => l.type === 'add');
    const hasDeletes = hunk.lines.some(l => l.type === 'delete');

    if (hasAdds && hasDeletes) {
      // Conflict detected
      hasConflicts = true;

      const localChanges: string[] = [];
      const remoteChanges: string[] = [];

      for (const line of hunk.lines) {
        if (line.type === 'delete') {
          localChanges.push(line.content);
        } else if (line.type === 'add') {
          remoteChanges.push(line.content);
        }
      }

      conflicts.push({
        start: lineNumber,
        end: lineNumber + Math.max(localChanges.length, remoteChanges.length),
        local: localChanges,
        remote: remoteChanges
      });

      // Add conflict markers
      mergedLines.push('<<<<<<< LOCAL');
      mergedLines.push(...localChanges);
      mergedLines.push('=======');
      mergedLines.push(...remoteChanges);
      mergedLines.push('>>>>>>> REMOTE');

      lineNumber += localChanges.length + remoteChanges.length + 3;
      localIndex += localChanges.length;
      remoteIndex += remoteChanges.length;
    } else if (hasDeletes) {
      // Only local changes - use local
      for (const line of hunk.lines) {
        if (line.type !== 'add') {
          mergedLines.push(line.content);
          lineNumber++;
        }
      }
      localIndex += hunk.oldLines;
    } else if (hasAdds) {
      // Only remote changes - use remote
      for (const line of hunk.lines) {
        if (line.type !== 'delete') {
          mergedLines.push(line.content);
          lineNumber++;
        }
      }
      remoteIndex += hunk.newLines;
    }
  }

  // Add remaining unchanged lines
  while (localIndex < localLines.length) {
    mergedLines.push(localLines[localIndex]);
    localIndex++;
  }

  return {
    hasConflicts,
    mergedContent: mergedLines.join('\n'),
    conflicts
  };
}

/**
 * Detect conflicts using 3-way merge
 */
function detectThreeWayConflicts(
  localLines: string[],
  remoteLines: string[],
  baseLines: string[]
): ConflictResult {
  const conflicts: ConflictBlock[] = [];
  const mergedLines: string[] = [];
  let hasConflicts = false;

  // Compare local and base
  const localDiff = calculateDiff(baseLines.join('\n'), localLines.join('\n'));
  
  // Compare remote and base
  const remoteDiff = calculateDiff(baseLines.join('\n'), remoteLines.join('\n'));

  // Find overlapping changes (conflicts)
  const localChanges = new Map<number, string[]>();
  const remoteChanges = new Map<number, string[]>();

  // Extract local changes
  for (const hunk of localDiff.hunks) {
    const changes: string[] = [];
    for (const line of hunk.lines) {
      if (line.type === 'add') {
        changes.push(line.content);
      }
    }
    if (changes.length > 0) {
      localChanges.set(hunk.oldStart, changes);
    }
  }

  // Extract remote changes
  for (const hunk of remoteDiff.hunks) {
    const changes: string[] = [];
    for (const line of hunk.lines) {
      if (line.type === 'add') {
        changes.push(line.content);
      }
    }
    if (changes.length > 0) {
      remoteChanges.set(hunk.oldStart, changes);
    }
  }

  // Merge line by line
  let lineNumber = 0;
  for (let i = 0; i < Math.max(baseLines.length, localLines.length, remoteLines.length); i++) {
    const baseLine = baseLines[i];
    const localLine = localLines[i];
    const remoteLine = remoteLines[i];

    // Check for conflicts at this line
    const hasLocalChange = localChanges.has(i);
    const hasRemoteChange = remoteChanges.has(i);

    if (hasLocalChange && hasRemoteChange) {
      // Conflict detected
      const local = localChanges.get(i)!;
      const remote = remoteChanges.get(i)!;

      // Check if changes are identical
      if (local.join('\n') === remote.join('\n')) {
        // Same changes, no conflict
        mergedLines.push(...local);
        lineNumber += local.length;
      } else {
        // Different changes, conflict
        hasConflicts = true;
        conflicts.push({
          start: lineNumber,
          end: lineNumber + Math.max(local.length, remote.length),
          local,
          remote
        });

        // Add conflict markers
        mergedLines.push('<<<<<<< LOCAL');
        mergedLines.push(...local);
        mergedLines.push('=======');
        mergedLines.push(...remote);
        mergedLines.push('>>>>>>> REMOTE');
        lineNumber += local.length + remote.length + 3;
      }
    } else if (hasLocalChange) {
      // Only local changed
      const local = localChanges.get(i)!;
      mergedLines.push(...local);
      lineNumber += local.length;
    } else if (hasRemoteChange) {
      // Only remote changed
      const remote = remoteChanges.get(i)!;
      mergedLines.push(...remote);
      lineNumber += remote.length;
    } else if (baseLine !== undefined) {
      // No changes
      mergedLines.push(baseLine);
      lineNumber++;
    }
  }

  return {
    hasConflicts,
    mergedContent: mergedLines.join('\n'),
    conflicts
  };
}

/**
 * Resolve a conflict using specified strategy
 * 
 * @param conflict - Conflict block
 * @param resolution - Resolution strategy
 * @returns Resolved content
 */
export function resolveConflict(
  conflict: ConflictBlock,
  resolution: ResolutionStrategy
): string {
  switch (resolution) {
    case 'local':
      return conflict.local.join('\n');
    case 'remote':
      return conflict.remote.join('\n');
    case 'both':
      return [...conflict.local, ...conflict.remote].join('\n');
    default:
      return conflict.local.join('\n');
  }
}

/**
 * Apply conflict resolutions to merged content
 * 
 * @param mergedContent - Content with conflict markers
 * @param resolutions - Map of conflict start line to resolution strategy
 * @returns Resolved content
 */
export function applyResolutions(
  mergedContent: string,
  resolutions: Map<number, ResolutionStrategy>
): string {
  const lines = mergedContent.split('\n');
  const resolvedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line === '<<<<<<< LOCAL') {
      // Found conflict marker
      const conflictStart = i;
      const localLines: string[] = [];
      const remoteLines: string[] = [];
      let inLocal = true;

      i++; // Skip marker

      // Read local changes
      while (i < lines.length && lines[i] !== '=======') {
        localLines.push(lines[i]);
        i++;
      }

      i++; // Skip separator

      // Read remote changes
      while (i < lines.length && lines[i] !== '>>>>>>> REMOTE') {
        remoteLines.push(lines[i]);
        i++;
      }

      i++; // Skip marker

      // Apply resolution
      const resolution = resolutions.get(conflictStart) || 'local';
      const resolved = resolveConflict(
        { start: conflictStart, end: i, local: localLines, remote: remoteLines },
        resolution
      );
      resolvedLines.push(resolved);
    } else {
      resolvedLines.push(line);
      i++;
    }
  }

  return resolvedLines.join('\n');
}

/**
 * Check if content has unresolved conflicts
 * 
 * @param content - File content
 * @returns True if conflicts exist
 */
export function hasUnresolvedConflicts(content: string): boolean {
  return content.includes('<<<<<<< LOCAL');
}

/**
 * Count conflicts in content
 * 
 * @param content - File content
 * @returns Number of conflicts
 */
export function countConflicts(content: string): number {
  const matches = content.match(/<<<<<<< LOCAL/g);
  return matches ? matches.length : 0;
}
