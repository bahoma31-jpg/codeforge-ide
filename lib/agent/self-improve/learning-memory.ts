/**
 * CodeForge IDE — Learning Memory
 * Persists successful fix patterns for future reference.
 * Allows the agent to learn from past self-improvement tasks.
 *
 * Phase 2: OODA Loop Implementation.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  SelfImprovementTask,
  FixPattern,
  SelfImproveStats,
  IssueCategory,
} from './types';

// ─── Storage Key ──────────────────────────────────────────────

const STORAGE_KEY = 'codeforge-self-improve-memory';
const MAX_PATTERNS = 100;

// ─── Learning Memory ──────────────────────────────────────────

/**
 * LearningMemory — Persistent pattern storage for self-improvement.
 *
 * Records successful fix patterns and retrieves them when similar
 * issues arise in the future. Uses localStorage for persistence.
 *
 * Usage:
 * ```ts
 * const memory = getLearningMemory();
 * memory.recordSuccess(completedTask);
 * const suggestions = memory.findSimilar('sidebar rendering issue');
 * ```
 */
export class LearningMemory {
  private patterns: FixPattern[] = [];
  private loaded: boolean = false;

  constructor() {
    this.load();
  }

  // ─── Public API ───────────────────────────────────────────

  /**
   * Record a successful fix as a learnable pattern.
   * Only records completed tasks with passing verification.
   */
  recordSuccess(task: SelfImprovementTask): FixPattern | null {
    if (task.status !== 'completed') return null;
    if (!task.execution.verificationResult?.passed) return null;

    // Build problem signature from task data
    const signature = this.buildSignature(task);

    // Check for duplicate/similar patterns
    const existing = this.findExactMatch(signature);
    if (existing) {
      // Update existing pattern
      existing.timesUsed++;
      existing.lastUsed = Date.now();
      existing.successRate = Math.min(
        1.0,
        (existing.successRate * (existing.timesUsed - 1) + 1) / existing.timesUsed
      );
      this.save();
      return existing;
    }

    // Create new pattern
    const pattern: FixPattern = {
      id: uuidv4(),
      problemSignature: signature,
      category: task.category,
      solution: this.buildSolutionSummary(task),
      filesInvolved: task.execution.changes.map(c => c.filePath),
      successRate: 1.0,
      timesUsed: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };

    this.patterns.push(pattern);

    // Prune old patterns if over limit
    if (this.patterns.length > MAX_PATTERNS) {
      this.prunePatterns();
    }

    this.save();
    return pattern;
  }

  /**
   * Record a failed fix attempt to decrease confidence.
   */
  recordFailure(task: SelfImprovementTask): void {
    const signature = this.buildSignature(task);
    const existing = this.findExactMatch(signature);

    if (existing) {
      existing.timesUsed++;
      existing.successRate = Math.max(
        0,
        (existing.successRate * (existing.timesUsed - 1)) / existing.timesUsed
      );
      existing.lastUsed = Date.now();
      this.save();
    }
  }

  /**
   * Find patterns similar to a described problem.
   * Returns ranked by similarity and success rate.
   */
  findSimilar(
    description: string,
    maxResults: number = 5
  ): Array<{ pattern: FixPattern; similarity: number }> {
    const descKeywords = this.extractKeywords(description);
    const results: Array<{ pattern: FixPattern; similarity: number }> = [];

    for (const pattern of this.patterns) {
      const patternKeywords = this.extractKeywords(pattern.problemSignature);

      // Calculate Jaccard similarity
      const intersection = descKeywords.filter(k => patternKeywords.includes(k));
      const union = new Set([...descKeywords, ...patternKeywords]);
      const similarity = union.size > 0 ? intersection.length / union.size : 0;

      // Boost by success rate
      const score = similarity * 0.7 + pattern.successRate * 0.3;

      if (score > 0.15) {
        results.push({ pattern, similarity: score });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Find patterns by category.
   */
  findByCategory(category: IssueCategory): FixPattern[] {
    return this.patterns
      .filter(p => p.category === category)
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get statistics about self-improvement activity.
   */
  getStats(): SelfImproveStats {
    const fileModCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const pattern of this.patterns) {
      for (const file of pattern.filesInvolved) {
        fileModCounts[file] = (fileModCounts[file] || 0) + pattern.timesUsed;
      }
      categoryCounts[pattern.category] = (categoryCounts[pattern.category] || 0) + 1;
    }

    const totalTasks = this.patterns.reduce((sum, p) => sum + p.timesUsed, 0);
    const completedTasks = this.patterns.reduce(
      (sum, p) => sum + Math.round(p.timesUsed * p.successRate),
      0
    );

    return {
      totalTasks,
      completedTasks,
      failedTasks: totalTasks - completedTasks,
      averageIterations: 0, // Would need task history tracking
      mostModifiedFiles: Object.entries(fileModCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count })),
      commonCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([category, count]) => ({
          category: category as IssueCategory,
          count,
        })),
    };
  }

  /** Get all patterns (for debugging/display) */
  getAllPatterns(): FixPattern[] {
    return [...this.patterns];
  }

  /** Clear all patterns */
  clear(): void {
    this.patterns = [];
    this.save();
  }

  // ─── Private Methods ──────────────────────────────────────

  /** Build a problem signature from task data */
  private buildSignature(task: SelfImprovementTask): string {
    const parts = [
      task.category,
      task.observation.affectedArea,
      task.orientation.rootCause.substring(0, 100),
      ...task.observation.detectedFiles.slice(0, 3),
    ];
    return parts.filter(Boolean).join(' | ');
  }

  /** Build a human-readable solution summary */
  private buildSolutionSummary(task: SelfImprovementTask): string {
    const changes = task.execution.changes;
    if (changes.length === 0) return 'No changes made';

    const parts = changes.map(c => {
      const fileName = c.filePath.split('/').pop();
      return `${c.changeType} ${fileName}`;
    });

    return `${task.orientation.rootCause.substring(0, 80)} → ${parts.join(', ')}`;
  }

  /** Find an exact match by signature */
  private findExactMatch(signature: string): FixPattern | undefined {
    return this.patterns.find(p => p.problemSignature === signature);
  }

  /** Extract keywords from text for similarity matching */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s|,;:.!?()\[\]{}'"/\\→]+/)
      .filter(k => k.length > 2)
      .filter(k => !['the', 'and', 'for', 'from', 'with', 'that', 'this'].includes(k));
  }

  /** Remove lowest-value patterns to stay under limit */
  private prunePatterns(): void {
    // Sort by value score (success rate * recency * usage)
    const now = Date.now();
    const scored = this.patterns.map(p => ({
      pattern: p,
      score:
        p.successRate * 0.4 +
        Math.min(1, p.timesUsed / 10) * 0.3 +
        Math.max(0, 1 - (now - p.lastUsed) / (30 * 24 * 60 * 60 * 1000)) * 0.3,
    }));

    scored.sort((a, b) => b.score - a.score);
    this.patterns = scored.slice(0, MAX_PATTERNS).map(s => s.pattern);
  }

  /** Load patterns from localStorage */
  private load(): void {
    if (this.loaded) return;
    this.loaded = true;

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.patterns = parsed;
          }
        }
      }
    } catch {
      // localStorage not available (SSR) — start empty
      this.patterns = [];
    }
  }

  /** Save patterns to localStorage */
  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.patterns));
      }
    } catch {
      // localStorage not available or full — silently fail
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────

let memoryInstance: LearningMemory | null = null;

export function getLearningMemory(): LearningMemory {
  if (!memoryInstance) {
    memoryInstance = new LearningMemory();
  }
  return memoryInstance;
}
