/**
 * CodeForge IDE - Diff Engine
 * Agent 5: Phase 2 - Task 4
 * 
 * Line-by-line diff calculator
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
  oldLineNumber?: number; // Line number in old file
  newLineNumber?: number; // Line number in new file
}

/**
 * Diff hunk (contiguous block of changes)
 */
export interface DiffHunk {
  oldStart: number; // Starting line in old file
  oldLines: number; // Number of lines in old file
  newStart: number; // Starting line in new file
  newLines: number; // Number of lines in new file
  lines: DiffLine[];
}

/**
 * Complete diff result
 */
export interface DiffResult {
  additions: number; // Total added lines
  deletions: number; // Total deleted lines
  hunks: DiffHunk[];
}

/**
 * Calculate diff between old and new content
 * 
 * Simple line-by-line algorithm (not Myers algorithm)
 * Good enough for most use cases
 * 
 * @param oldContent - Original content
 * @param newContent - Modified content
 * @returns Diff result with hunks
 */
export function calculateDiff(
  oldContent: string,
  newContent: string
): DiffResult {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Calculate LCS (Longest Common Subsequence) for better diff
  const lcs = calculateLCS(oldLines, newLines);
  
  // Build diff lines
  const diffLines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let lcsIndex = 0;

  let additions = 0;
  let deletions = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];
    const lcsLine = lcs[lcsIndex];

    if (oldLine === lcsLine && newLine === lcsLine) {
      // Context line (unchanged)
      diffLines.push({
        type: 'context',
        content: oldLine,
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1
      });
      oldIndex++;
      newIndex++;
      lcsIndex++;
    } else if (oldLine === lcsLine) {
      // Line added in new
      diffLines.push({
        type: 'add',
        content: newLine,
        newLineNumber: newIndex + 1
      });
      additions++;
      newIndex++;
    } else if (newLine === lcsLine) {
      // Line deleted from old
      diffLines.push({
        type: 'delete',
        content: oldLine,
        oldLineNumber: oldIndex + 1
      });
      deletions++;
      oldIndex++;
    } else {
      // Lines differ - mark as delete + add
      if (oldIndex < oldLines.length) {
        diffLines.push({
          type: 'delete',
          content: oldLine,
          oldLineNumber: oldIndex + 1
        });
        deletions++;
        oldIndex++;
      }
      if (newIndex < newLines.length) {
        diffLines.push({
          type: 'add',
          content: newLine,
          newLineNumber: newIndex + 1
        });
        additions++;
        newIndex++;
      }
    }
  }

  // Group diff lines into hunks
  const hunks = groupIntoHunks(diffLines, 3); // 3 context lines

  return {
    additions,
    deletions,
    hunks
  };
}

/**
 * Calculate Longest Common Subsequence
 * 
 * Used to find unchanged lines between old and new content
 */
function calculateLCS(oldLines: string[], newLines: string[]): string[] {
  const m = oldLines.length;
  const n = newLines.length;
  
  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      lcs.unshift(oldLines[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Group diff lines into hunks
 * 
 * Hunks are contiguous blocks of changes with context lines
 * 
 * @param diffLines - All diff lines
 * @param contextLines - Number of context lines to include
 * @returns Array of hunks
 */
function groupIntoHunks(diffLines: DiffLine[], contextLines: number): DiffHunk[] {
  if (diffLines.length === 0) return [];

  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] = [];
  let contextCount = 0;
  let oldStart = 1;
  let newStart = 1;
  let oldLines = 0;
  let newLines = 0;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];

    if (line.type === 'context') {
      contextCount++;
      
      if (currentHunk.length === 0) {
        // Start of potential new hunk
        oldStart = line.oldLineNumber || 1;
        newStart = line.newLineNumber || 1;
      }

      currentHunk.push(line);
      oldLines++;
      newLines++;

      // Check if we should close this hunk
      if (contextCount >= contextLines * 2 && i < diffLines.length - 1) {
        // Enough context, close hunk
        hunks.push({
          oldStart,
          oldLines,
          newStart,
          newLines,
          lines: currentHunk.slice(0, -contextLines)
        });

        // Reset for next hunk
        currentHunk = currentHunk.slice(-contextLines);
        oldLines = contextLines;
        newLines = contextLines;
        contextCount = contextLines;
        oldStart = line.oldLineNumber || 1;
        newStart = line.newLineNumber || 1;
      }
    } else {
      // Change line (add or delete)
      contextCount = 0;
      
      if (currentHunk.length === 0) {
        // Include previous context lines
        const contextStart = Math.max(0, i - contextLines);
        for (let j = contextStart; j < i; j++) {
          currentHunk.push(diffLines[j]);
        }
        oldStart = diffLines[contextStart]?.oldLineNumber || 1;
        newStart = diffLines[contextStart]?.newLineNumber || 1;
        oldLines = currentHunk.filter(l => l.type !== 'add').length;
        newLines = currentHunk.filter(l => l.type !== 'delete').length;
      }

      currentHunk.push(line);
      
      if (line.type === 'delete') {
        oldLines++;
      } else if (line.type === 'add') {
        newLines++;
      }
    }
  }

  // Close final hunk
  if (currentHunk.length > 0) {
    hunks.push({
      oldStart,
      oldLines,
      newStart,
      newLines,
      lines: currentHunk
    });
  }

  return hunks;
}

/**
 * Format diff hunk as unified diff string
 * 
 * @param hunk - Diff hunk
 * @returns Formatted string
 */
export function formatHunk(hunk: DiffHunk): string {
  const header = `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
  const lines = hunk.lines.map(line => {
    switch (line.type) {
      case 'add':
        return `+${line.content}`;
      case 'delete':
        return `-${line.content}`;
      case 'context':
        return ` ${line.content}`;
    }
  });
  
  return [header, ...lines].join('\n');
}

/**
 * Format complete diff as unified diff string
 * 
 * @param result - Diff result
 * @param oldPath - Path to old file
 * @param newPath - Path to new file
 * @returns Formatted unified diff
 */
export function formatDiff(
  result: DiffResult,
  oldPath: string,
  newPath: string
): string {
  const header = [
    `--- ${oldPath}`,
    `+++ ${newPath}`
  ];

  const hunks = result.hunks.map(formatHunk);

  return [...header, ...hunks].join('\n');
}
