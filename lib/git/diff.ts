/**
 * CodeForge IDE - Diff Engine
 * Agent 5: GitHub Integration
 * 
 * Line-by-line diff calculator for showing file changes
 * Simple but effective implementation without complex Myers algorithm
 */

/**
 * Diff line type
 */
export type DiffLineType = 'add' | 'delete' | 'context';

/**
 * Single line in diff
 */
export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;  // Line number in old file
  newLineNumber?: number;  // Line number in new file
}

/**
 * Diff hunk (chunk of changes)
 */
export interface DiffHunk {
  oldStart: number;        // Starting line in old file
  oldLines: number;        // Number of lines in old file
  newStart: number;        // Starting line in new file
  newLines: number;        // Number of lines in new file
  lines: DiffLine[];       // Lines in this hunk
}

/**
 * Complete diff result
 */
export interface DiffResult {
  additions: number;       // Total lines added
  deletions: number;       // Total lines deleted
  changes: number;         // Total changes (additions + deletions)
  hunks: DiffHunk[];      // Change hunks
}

/**
 * Calculate diff between two strings
 * 
 * @param oldContent - Original content
 * @param newContent - Modified content
 * @param contextLines - Number of context lines around changes (default: 3)
 * @returns Diff result with hunks
 */
export function calculateDiff(
  oldContent: string,
  newContent: string,
  contextLines: number = 3
): DiffResult {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Calculate line changes
  const changes = calculateLineChanges(oldLines, newLines);

  // Group changes into hunks
  const hunks = groupIntoHunks(changes, oldLines, newLines, contextLines);

  // Calculate statistics
  let additions = 0;
  let deletions = 0;

  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') additions++;
      if (line.type === 'delete') deletions++;
    }
  }

  return {
    additions,
    deletions,
    changes: additions + deletions,
    hunks,
  };
}

/**
 * Calculate which lines changed (simple LCS-based approach)
 */
function calculateLineChanges(
  oldLines: string[],
  newLines: string[]
): { oldIndex: number; newIndex: number; type: 'same' | 'changed' }[] {
  const changes: { oldIndex: number; newIndex: number; type: 'same' | 'changed' }[] = [];

  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    // Both lines exist and are the same
    if (oldLine === newLine) {
      changes.push({ oldIndex, newIndex, type: 'same' });
      oldIndex++;
      newIndex++;
      continue;
    }

    // Check if old line exists later in new file (deletion)
    if (oldIndex < oldLines.length && newIndex < newLines.length) {
      const foundInNew = newLines.slice(newIndex).indexOf(oldLine);
      const foundInOld = oldLines.slice(oldIndex).indexOf(newLine);

      // Old line appears later in new - lines were added before it
      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew < foundInOld)) {
        changes.push({ oldIndex: -1, newIndex, type: 'changed' });
        newIndex++;
        continue;
      }

      // New line appears later in old - lines were deleted before it
      if (foundInOld !== -1) {
        changes.push({ oldIndex, newIndex: -1, type: 'changed' });
        oldIndex++;
        continue;
      }
    }

    // No match found - consider as changed
    if (oldIndex < oldLines.length && newIndex < newLines.length) {
      changes.push({ oldIndex, newIndex: -1, type: 'changed' });
      changes.push({ oldIndex: -1, newIndex, type: 'changed' });
      oldIndex++;
      newIndex++;
    } else if (oldIndex < oldLines.length) {
      // Only old lines left (deletions)
      changes.push({ oldIndex, newIndex: -1, type: 'changed' });
      oldIndex++;
    } else {
      // Only new lines left (additions)
      changes.push({ oldIndex: -1, newIndex, type: 'changed' });
      newIndex++;
    }
  }

  return changes;
}

/**
 * Group changes into hunks with context lines
 */
function groupIntoHunks(
  changes: { oldIndex: number; newIndex: number; type: 'same' | 'changed' }[],
  oldLines: string[],
  newLines: string[],
  contextLines: number
): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] | null = null;
  let hunkOldStart = 0;
  let hunkNewStart = 0;
  let contextBuffer: DiffLine[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];

    if (change.type === 'same') {
      const line: DiffLine = {
        type: 'context',
        content: oldLines[change.oldIndex],
        oldLineNumber: change.oldIndex + 1,
        newLineNumber: change.newIndex + 1,
      };

      if (currentHunk) {
        // Add to context buffer
        contextBuffer.push(line);

        // If buffer exceeds context lines * 2, close current hunk
        if (contextBuffer.length > contextLines * 2) {
          // Add first contextLines to current hunk
          currentHunk.push(...contextBuffer.slice(0, contextLines));

          // Close current hunk
          hunks.push(createHunkFromLines(currentHunk, hunkOldStart, hunkNewStart));

          // Reset
          currentHunk = null;
          contextBuffer = [];
        }
      } else {
        // Add to context buffer for next hunk
        contextBuffer.push(line);
        if (contextBuffer.length > contextLines) {
          contextBuffer.shift();
        }
      }
    } else {
      // Changed line
      if (!currentHunk) {
        // Start new hunk
        currentHunk = [];
        hunkOldStart = Math.max(0, change.oldIndex - contextBuffer.length);
        hunkNewStart = Math.max(0, change.newIndex - contextBuffer.length);

        // Add context buffer to hunk
        currentHunk.push(...contextBuffer);
        contextBuffer = [];
      }

      // Add changed line
      if (change.oldIndex !== -1) {
        currentHunk.push({
          type: 'delete',
          content: oldLines[change.oldIndex],
          oldLineNumber: change.oldIndex + 1,
        });
      }

      if (change.newIndex !== -1) {
        currentHunk.push({
          type: 'add',
          content: newLines[change.newIndex],
          newLineNumber: change.newIndex + 1,
        });
      }
    }
  }

  // Close last hunk if exists
  if (currentHunk) {
    currentHunk.push(...contextBuffer.slice(0, contextLines));
    hunks.push(createHunkFromLines(currentHunk, hunkOldStart, hunkNewStart));
  }

  return hunks;
}

/**
 * Create hunk from lines
 */
function createHunkFromLines(
  lines: DiffLine[],
  oldStart: number,
  newStart: number
): DiffHunk {
  let oldLines = 0;
  let newLines = 0;

  for (const line of lines) {
    if (line.type === 'delete' || line.type === 'context') oldLines++;
    if (line.type === 'add' || line.type === 'context') newLines++;
  }

  return {
    oldStart: oldStart + 1,
    oldLines,
    newStart: newStart + 1,
    newLines,
    lines,
  };
}

/**
 * Format diff as unified diff string (Git format)
 * 
 * @param fileName - File name
 * @param diff - Diff result
 * @returns Unified diff string
 */
export function formatUnifiedDiff(fileName: string, diff: DiffResult): string {
  const lines: string[] = [];

  lines.push(`diff --git a/${fileName} b/${fileName}`);
  lines.push(`--- a/${fileName}`);
  lines.push(`+++ b/${fileName}`);

  for (const hunk of diff.hunks) {
    lines.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
    );

    for (const line of hunk.lines) {
      const prefix =
        line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ';
      lines.push(`${prefix}${line.content}`);
    }
  }

  return lines.join('\n');
}

/**
 * Apply diff to content (simple patch)
 * 
 * @param originalContent - Original file content
 * @param diff - Diff to apply
 * @returns Modified content
 */
export function applyDiff(originalContent: string, diff: DiffResult): string {
  const lines = originalContent.split('\n');
  const result: string[] = [];
  let currentLine = 0;

  for (const hunk of diff.hunks) {
    // Add unchanged lines before hunk
    while (currentLine < hunk.oldStart - 1) {
      result.push(lines[currentLine]);
      currentLine++;
    }

    // Apply hunk changes
    for (const line of hunk.lines) {
      if (line.type === 'add') {
        result.push(line.content);
      } else if (line.type === 'delete') {
        currentLine++; // Skip deleted line
      } else {
        result.push(line.content);
        currentLine++;
      }
    }
  }

  // Add remaining unchanged lines
  while (currentLine < lines.length) {
    result.push(lines[currentLine]);
    currentLine++;
  }

  return result.join('\n');
}
