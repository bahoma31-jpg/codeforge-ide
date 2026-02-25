/**
 * Git Diff Engine
 * 
 * Provides line-by-line diff calculation for comparing file versions.
 * Uses a simple line-by-line algorithm (not Myers algorithm).
 * 
 * @module lib/git/diff
 */

/**
 * Type of diff line
 */
export type DiffLineType = 'add' | 'delete' | 'context';

/**
 * Single line in a diff
 */
export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * A hunk of changes (contiguous block of changed lines)
 */
export interface DiffHunk {
  /** Starting line number in old file */
  oldStart: number;
  /** Number of lines in old file */
  oldLines: number;
  /** Starting line number in new file */
  newStart: number;
  /** Number of lines in new file */
  newLines: number;
  /** Lines in this hunk */
  lines: DiffLine[];
}

/**
 * Complete diff result
 */
export interface DiffResult {
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
  /** Hunks of changes */
  hunks: DiffHunk[];
  /** True if there are any changes */
  hasChanges: boolean;
}

/**
 * Calculate diff between two file versions
 * 
 * @param oldContent - Original file content
 * @param newContent - Modified file content
 * @param contextLines - Number of context lines around changes (default: 3)
 * @returns DiffResult
 * 
 * @example
 * ```ts
 * const oldFile = 'line 1\nline 2\nline 3';
 * const newFile = 'line 1\nmodified line 2\nline 3';
 * const diff = calculateDiff(oldFile, newFile);
 * // Returns: { additions: 1, deletions: 1, hunks: [...] }
 * ```
 */
export function calculateDiff(
  oldContent: string,
  newContent: string,
  contextLines: number = 3
): DiffResult {
  try {
    // Split into lines
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Calculate simple diff
    const diffLines = simpleDiff(oldLines, newLines);

    // Group into hunks
    const hunks = groupIntoHunks(diffLines, contextLines);

    // Count additions and deletions
    const additions = diffLines.filter(l => l.type === 'add').length;
    const deletions = diffLines.filter(l => l.type === 'delete').length;

    return {
      additions,
      deletions,
      hunks,
      hasChanges: additions > 0 || deletions > 0
    };
  } catch (error) {
    console.error('Error calculating diff:', error);
    return {
      additions: 0,
      deletions: 0,
      hunks: [],
      hasChanges: false
    };
  }
}

/**
 * Simple line-by-line diff algorithm
 * 
 * @param oldLines - Lines from old file
 * @param newLines - Lines from new file
 * @returns Array of DiffLine
 */
function simpleDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    // Both files ended
    if (oldIndex >= oldLines.length && newIndex >= newLines.length) {
      break;
    }

    // Old file ended - remaining are additions
    if (oldIndex >= oldLines.length) {
      result.push({
        type: 'add',
        content: newLine,
        newLineNumber: newIndex + 1
      });
      newIndex++;
      continue;
    }

    // New file ended - remaining are deletions
    if (newIndex >= newLines.length) {
      result.push({
        type: 'delete',
        content: oldLine,
        oldLineNumber: oldIndex + 1
      });
      oldIndex++;
      continue;
    }

    // Lines match - context line
    if (oldLine === newLine) {
      result.push({
        type: 'context',
        content: oldLine,
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1
      });
      oldIndex++;
      newIndex++;
      continue;
    }

    // Lines don't match - check if line was modified or deleted/added
    const oldLineFoundAhead = newLines.slice(newIndex + 1, newIndex + 5).indexOf(oldLine);
    const newLineFoundAhead = oldLines.slice(oldIndex + 1, oldIndex + 5).indexOf(newLine);

    // Line appears ahead in new file - old line was deleted
    if (oldLineFoundAhead !== -1) {
      result.push({
        type: 'delete',
        content: oldLine,
        oldLineNumber: oldIndex + 1
      });
      oldIndex++;
      continue;
    }

    // Line appears ahead in old file - new line was added
    if (newLineFoundAhead !== -1) {
      result.push({
        type: 'add',
        content: newLine,
        newLineNumber: newIndex + 1
      });
      newIndex++;
      continue;
    }

    // Lines are different - treat as delete + add
    result.push({
      type: 'delete',
      content: oldLine,
      oldLineNumber: oldIndex + 1
    });
    result.push({
      type: 'add',
      content: newLine,
      newLineNumber: newIndex + 1
    });
    oldIndex++;
    newIndex++;
  }

  return result;
}

/**
 * Group diff lines into hunks
 * 
 * @param diffLines - Array of diff lines
 * @param contextLines - Number of context lines around changes
 * @returns Array of DiffHunk
 */
function groupIntoHunks(diffLines: DiffLine[], contextLines: number): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] | null = null;
  let consecutiveContextLines = 0;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];

    // Found a change - start or continue hunk
    if (line.type !== 'context') {
      if (!currentHunk) {
        // Start new hunk with preceding context
        currentHunk = [];
        const contextStart = Math.max(0, i - contextLines);
        for (let j = contextStart; j < i; j++) {
          currentHunk.push(diffLines[j]);
        }
      }
      currentHunk.push(line);
      consecutiveContextLines = 0;
    } else {
      // Context line
      if (currentHunk) {
        currentHunk.push(line);
        consecutiveContextLines++;

        // If we have enough context lines, close the hunk
        if (consecutiveContextLines > contextLines * 2) {
          // Remove excess context from end
          const excessContext = consecutiveContextLines - contextLines;
          const finalHunk = currentHunk.slice(0, -excessContext);
          hunks.push(createHunk(finalHunk));
          currentHunk = null;
          consecutiveContextLines = 0;
        }
      }
    }
  }

  // Close final hunk if exists
  if (currentHunk && currentHunk.length > 0) {
    hunks.push(createHunk(currentHunk));
  }

  return hunks;
}

/**
 * Create a hunk from array of lines
 * 
 * @param lines - Lines in the hunk
 * @returns DiffHunk
 */
function createHunk(lines: DiffLine[]): DiffHunk {
  const firstOldLine = lines.find(l => l.oldLineNumber)?.oldLineNumber || 1;
  const firstNewLine = lines.find(l => l.newLineNumber)?.newLineNumber || 1;

  const oldLines = lines.filter(l => l.type === 'delete' || l.type === 'context').length;
  const newLines = lines.filter(l => l.type === 'add' || l.type === 'context').length;

  return {
    oldStart: firstOldLine,
    oldLines,
    newStart: firstNewLine,
    newLines,
    lines
  };
}

/**
 * Format diff as unified diff string
 * 
 * @param diff - DiffResult
 * @param oldPath - Path to old file
 * @param newPath - Path to new file
 * @returns Unified diff string
 * 
 * @example
 * ```ts
 * const diffStr = formatUnifiedDiff(diff, 'a/file.ts', 'b/file.ts');
 * console.log(diffStr);
 * // Output:
 * // --- a/file.ts
 * // +++ b/file.ts
 * // @@ -1,3 +1,3 @@
 * //  line 1
 * // -line 2
 * // +modified line 2
 * //  line 3
 * ```
 */
export function formatUnifiedDiff(
  diff: DiffResult,
  oldPath: string,
  newPath: string
): string {
  const lines: string[] = [];

  lines.push(`--- ${oldPath}`);
  lines.push(`+++ ${newPath}`);

  for (const hunk of diff.hunks) {
    lines.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
    );

    for (const line of hunk.lines) {
      const prefix = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ';
      lines.push(`${prefix}${line.content}`);
    }
  }

  return lines.join('\n');
}
