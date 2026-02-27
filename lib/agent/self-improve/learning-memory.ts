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

// ─── Storage Key ────────────────────────────────────────────

const STORAGE_KEY = 'codeforge-self-improve-memory';
const MAX_PATTERNS = 100;

// ─── Direct Pattern Input (used by unit tests) ─────────────────

export interface PatternInput {
  category: string;
  description: string;
  filesModified: string[];
  fixSteps: string[];
  issueKeywords: string[];
}

export interface FailureInput {
  category: string;
  issueKeywords: string[];
}

// ─── Extended Stats Interface ───────────────────────────────

export interface ExtendedSelfImproveStats extends SelfImproveStats {
  totalPatterns: number;
  successfulPatterns: number;
  topCategories: Array<{ category: IssueCategory; count: number }>;
  topFiles: Array<{ path: string; count: number }>;
}

// ─── Learning Memory ────────────────────────────────────────

export class LearningMemory {
  private patterns: FixPattern[] = [];
  private loaded: boolean = false;

  constructor() {
    this.load();
  }

  // ─── Public API ───────────────────────────────────────

  /**
   * Record a successful pattern. Accepts either:
   *   1. PatternInput (flat: { category, description, filesModified, fixSteps, issueKeywords })
   *   2. SelfImprovementTask (legacy)
   */
  recordSuccess(input: PatternInput | SelfImprovementTask): FixPattern | null {
    // ── Detect flat PatternInput form ──
    if (this.isPatternInput(input)) {
      return this.recordSuccessFlat(input);
    }

    // ── Legacy SelfImprovementTask form ──
    return this.recordSuccessLegacy(input as SelfImprovementTask);
  }

  /**
   * Record a failure. Accepts either:
   *   1. FailureInput (flat: { category, issueKeywords })
   *   2. SelfImprovementTask (legacy)
   */
  recordFailure(input: FailureInput | SelfImprovementTask): void {
    if (this.isFailureInput(input)) {
      return this.recordFailureFlat(input);
    }

    return this.recordFailureLegacy(input as SelfImprovementTask);
  }

  /**
   * Find similar patterns. Accepts either:
   *   1. string[] keywords array
   *   2. string description (legacy)
   */
  findSimilar(
    input: string[] | string | undefined | null,
    maxResults: number = 5
  ): Array<{ pattern?: FixPattern; similarity?: number; description: string; successRate: number }> {
    if (Array.isArray(input)) {
      return this.findSimilarByKeywords(input, maxResults);
    }
    return this.findSimilarByDescription(input, maxResults);
  }

  findByCategory(category: IssueCategory): FixPattern[] {
    return this.patterns
      .filter(p => p.category === category)
      .sort((a, b) => b.successRate - a.successRate);
  }

  getStats(): ExtendedSelfImproveStats {
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

    const mostModifiedFiles = Object.entries(fileModCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    const commonCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category: category as IssueCategory,
        count,
      }));

    const successfulPatterns = this.patterns.filter(p => p.successRate > 0.5).length;

    return {
      totalTasks,
      completedTasks,
      failedTasks: totalTasks - completedTasks,
      averageIterations: 0,
      mostModifiedFiles,
      commonCategories,
      totalPatterns: this.patterns.length,
      successfulPatterns,
      topCategories: commonCategories,
      topFiles: mostModifiedFiles,
    };
  }

  getAllPatterns(): FixPattern[] {
    return [...this.patterns];
  }

  clear(): void {
    this.patterns = [];
    this.save();
  }

  // ─── Flat Form: recordSuccess ──────────────────────────────

  private recordSuccessFlat(input: PatternInput): FixPattern {
    const signature = [input.category, ...input.issueKeywords].join(' | ');

    const existing = this.findExactMatch(signature);
    if (existing) {
      existing.timesUsed++;
      existing.lastUsed = Date.now();
      existing.successRate = Math.min(
        1.0,
        (existing.successRate * (existing.timesUsed - 1) + 1) / existing.timesUsed
      );
      this.save();
      return existing;
    }

    const pattern: FixPattern = {
      id: uuidv4(),
      problemSignature: signature,
      category: input.category as IssueCategory,
      solution: input.fixSteps.join(', '),
      filesInvolved: input.filesModified,
      successRate: 1.0,
      timesUsed: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };

    // Store keywords in the problemSignature for similarity search
    (pattern as any)._keywords = input.issueKeywords;
    (pattern as any)._description = input.description;

    this.patterns.push(pattern);

    if (this.patterns.length > MAX_PATTERNS) {
      this.prunePatterns();
    }

    this.save();
    return pattern;
  }

  // ─── Flat Form: recordFailure ──────────────────────────────

  private recordFailureFlat(input: FailureInput): void {
    // Find best matching pattern by keywords
    const matches = this.findSimilarByKeywords(input.issueKeywords, 1);
    if (matches.length > 0 && matches[0].pattern) {
      const pattern = matches[0].pattern;
      pattern.timesUsed++;
      pattern.successRate = Math.max(
        0,
        (pattern.successRate * (pattern.timesUsed - 1)) / pattern.timesUsed
      );
      pattern.lastUsed = Date.now();
      this.save();
    }
  }

  // ─── Flat Form: findSimilar by keywords ─────────────────────

  private findSimilarByKeywords(
    keywords: string[],
    maxResults: number
  ): Array<{ pattern: FixPattern; similarity: number; description: string; successRate: number }> {
    const inputSet = new Set(keywords.map(k => k.toLowerCase()));
    const results: Array<{ pattern: FixPattern; similarity: number; description: string; successRate: number }> = [];

    for (const pattern of this.patterns) {
      // Get keywords from pattern
      const patternKeywords = new Set<string>();

      // From stored _keywords
      const storedKw = (pattern as any)._keywords as string[] | undefined;
      if (storedKw) {
        storedKw.forEach(k => patternKeywords.add(k.toLowerCase()));
      }

      // From problemSignature
      const sigWords = this.extractKeywords(pattern.problemSignature);
      sigWords.forEach(k => patternKeywords.add(k));

      // From category
      patternKeywords.add(pattern.category.toLowerCase());

      // Calculate Jaccard similarity
      const intersection = [...inputSet].filter(k => patternKeywords.has(k));
      const union = new Set([...inputSet, ...patternKeywords]);
      const similarity = union.size > 0 ? intersection.length / union.size : 0;

      if (similarity > 0) {
        const desc = (pattern as any)._description || pattern.solution || pattern.problemSignature;
        results.push({
          pattern,
          similarity,
          description: desc,
          successRate: pattern.successRate,
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  // ─── Legacy Form: findSimilar by description ────────────────

  private findSimilarByDescription(
    description: string | undefined | null,
    maxResults: number
  ): Array<{ pattern: FixPattern; similarity: number; description: string; successRate: number }> {
    const descKeywords = this.extractKeywords(description);
    const results: Array<{ pattern: FixPattern; similarity: number; description: string; successRate: number }> = [];

    for (const pattern of this.patterns) {
      const patternKeywords = this.extractKeywords(pattern.problemSignature);

      const intersection = descKeywords.filter(k => patternKeywords.includes(k));
      const union = new Set([...descKeywords, ...patternKeywords]);
      const similarity = union.size > 0 ? intersection.length / union.size : 0;
      const score = similarity * 0.7 + pattern.successRate * 0.3;

      if (score > 0.15) {
        const desc = (pattern as any)._description || pattern.solution || pattern.problemSignature;
        results.push({
          pattern,
          similarity: score,
          description: desc,
          successRate: pattern.successRate,
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  // ─── Legacy Form: recordSuccess ────────────────────────────

  private recordSuccessLegacy(task: SelfImprovementTask): FixPattern | null {
    if (task.status !== 'completed') return null;
    if (!task.execution?.verificationResult?.passed) return null;

    const signature = this.buildSignature(task);

    const existing = this.findExactMatch(signature);
    if (existing) {
      existing.timesUsed++;
      existing.lastUsed = Date.now();
      existing.successRate = Math.min(
        1.0,
        (existing.successRate * (existing.timesUsed - 1) + 1) / existing.timesUsed
      );
      this.save();
      return existing;
    }

    const changes = task.execution?.changes || [];

    const pattern: FixPattern = {
      id: uuidv4(),
      problemSignature: signature,
      category: task.category,
      solution: this.buildSolutionSummary(task),
      filesInvolved: changes.map(c => c.filePath),
      successRate: 1.0,
      timesUsed: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };

    this.patterns.push(pattern);

    if (this.patterns.length > MAX_PATTERNS) {
      this.prunePatterns();
    }

    this.save();
    return pattern;
  }

  // ─── Legacy Form: recordFailure ────────────────────────────

  private recordFailureLegacy(task: SelfImprovementTask): void {
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

  // ─── Type Guards ───────────────────────────────────────────

  private isPatternInput(input: any): input is PatternInput {
    return (
      input &&
      typeof input === 'object' &&
      'issueKeywords' in input &&
      'filesModified' in input &&
      'fixSteps' in input
    );
  }

  private isFailureInput(input: any): input is FailureInput {
    return (
      input &&
      typeof input === 'object' &&
      'issueKeywords' in input &&
      !('filesModified' in input) &&
      !('status' in input)
    );
  }

  // ─── Private Methods ──────────────────────────────────────

  private buildSignature(task: SelfImprovementTask): string {
    const parts: string[] = [];

    if (task.category) parts.push(task.category);
    if (task.observation?.affectedArea) parts.push(task.observation.affectedArea);
    if (task.orientation?.rootCause) parts.push(task.orientation.rootCause.substring(0, 100));
    if (task.observation?.detectedFiles) {
      parts.push(...task.observation.detectedFiles.slice(0, 3));
    }

    if (parts.length === 0 && task.description) {
      parts.push(task.description.substring(0, 150));
    }

    return parts.filter(Boolean).join(' | ');
  }

  private buildSolutionSummary(task: SelfImprovementTask): string {
    const changes = task.execution?.changes || [];
    if (changes.length === 0) return 'No changes made';

    const parts = changes.map(c => {
      const fileName = c.filePath.split('/').pop();
      return `${c.changeType} ${fileName}`;
    });

    const rootCause = task.orientation?.rootCause || 'Unknown cause';
    return `${rootCause.substring(0, 80)} \u2192 ${parts.join(', ')}`;
  }

  private findExactMatch(signature: string): FixPattern | undefined {
    return this.patterns.find(p => p.problemSignature === signature);
  }

  private extractKeywords(text: string | undefined | null): string[] {
    const safeText = String(text || '');
    if (!safeText.trim()) return [];

    return safeText
      .toLowerCase()
      .split(/[\s|,;:.!?()\[\]{}'"/\\\u2192]+/)
      .filter(k => k.length > 2)
      .filter(k => !['the', 'and', 'for', 'from', 'with', 'that', 'this'].includes(k));
  }

  private prunePatterns(): void {
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
      this.patterns = [];
    }
  }

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.patterns));
      }
    } catch {
      // localStorage not available or full
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────

let memoryInstance: LearningMemory | null = null;

export function getLearningMemory(): LearningMemory {
  if (!memoryInstance) {
    memoryInstance = new LearningMemory();
  }
  return memoryInstance;
}
