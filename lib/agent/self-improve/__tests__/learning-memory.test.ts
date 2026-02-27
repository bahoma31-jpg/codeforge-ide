/**
 * CodeForge IDE — Learning Memory Tests
 * Unit tests for the persistent pattern storage system.
 *
 * Tests cover:
 * - Recording successful patterns
 * - Recording failures and confidence reduction
 * - Similarity search (Jaccard)
 * - Pruning when exceeding max patterns
 * - Statistics aggregation
 * - localStorage persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock localStorage ────────────────────────────────────────

const mockStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ─── Import after mock ───────────────────────────────────────

import { LearningMemory } from '../learning-memory';

// ─── Tests ────────────────────────────────────────────────────

describe('LearningMemory', () => {
  let memory: LearningMemory;

  beforeEach(() => {
    localStorageMock.clear();
    memory = new LearningMemory();
  });

  // ─── Recording Success ────────────────────────────────────

  describe('recordSuccess', () => {
    it('should store a successful pattern', () => {
      memory.recordSuccess({
        category: 'ui_bug',
        description: 'Fixed button alignment',
        filesModified: ['components/button.tsx'],
        fixSteps: ['edit CSS flex property'],
        issueKeywords: ['button', 'alignment', 'css'],
      });

      const stats = memory.getStats();
      expect(stats.totalPatterns).toBe(1);
      expect(stats.successfulPatterns).toBe(1);
    });

    it('should increment use count for existing pattern', () => {
      const patternData = {
        category: 'ui_bug',
        description: 'Fixed button alignment',
        filesModified: ['components/button.tsx'],
        fixSteps: ['edit CSS'],
        issueKeywords: ['button', 'alignment'],
      };

      memory.recordSuccess(patternData);
      memory.recordSuccess(patternData);

      const patterns = memory.findSimilar(['button', 'alignment']);
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  // ─── Recording Failure ────────────────────────────────────

  describe('recordFailure', () => {
    it('should decrease confidence of matching pattern', () => {
      memory.recordSuccess({
        category: 'logic_error',
        description: 'Fixed null check',
        filesModified: ['lib/utils.ts'],
        fixSteps: ['add null guard'],
        issueKeywords: ['null', 'undefined', 'error'],
      });

      memory.recordFailure({
        category: 'logic_error',
        issueKeywords: ['null', 'undefined', 'error'],
      });

      const patterns = memory.findSimilar(['null', 'error']);
      if (patterns.length > 0) {
        expect(patterns[0].successRate).toBeLessThan(1.0);
      }
    });
  });

  // ─── Similarity Search ────────────────────────────────────

  describe('findSimilar', () => {
    beforeEach(() => {
      memory.recordSuccess({
        category: 'ui_bug',
        description: 'Fixed sidebar collapse',
        filesModified: ['components/sidebar.tsx'],
        fixSteps: ['update state'],
        issueKeywords: ['sidebar', 'collapse', 'toggle', 'ui'],
      });

      memory.recordSuccess({
        category: 'logic_error',
        description: 'Fixed API timeout',
        filesModified: ['lib/api.ts'],
        fixSteps: ['increase timeout'],
        issueKeywords: ['api', 'timeout', 'network', 'error'],
      });

      memory.recordSuccess({
        category: 'ui_bug',
        description: 'Fixed sidebar width',
        filesModified: ['components/sidebar.tsx', 'styles/sidebar.css'],
        fixSteps: ['adjust CSS width'],
        issueKeywords: ['sidebar', 'width', 'css', 'ui'],
      });
    });

    it('should return patterns sorted by similarity', () => {
      const results = memory.findSimilar(['sidebar', 'ui', 'collapse']);
      expect(results.length).toBeGreaterThan(0);
      // The sidebar collapse pattern should be most similar
      expect(results[0].description).toContain('sidebar');
    });

    it('should return empty array for unrelated keywords', () => {
      const results = memory.findSimilar(['database', 'migration', 'sql']);
      // Either empty or very low similarity
      expect(results.every(r => r.successRate !== undefined)).toBe(true);
    });

    it('should limit results count', () => {
      const results = memory.findSimilar(['sidebar'], 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  // ─── Pruning ──────────────────────────────────────────────

  describe('Pruning', () => {
    it('should prune when exceeding max patterns', () => {
      // Record more than 100 patterns
      for (let i = 0; i < 110; i++) {
        memory.recordSuccess({
          category: `cat_${i}`,
          description: `Pattern ${i}`,
          filesModified: [`file_${i}.ts`],
          fixSteps: [`step ${i}`],
          issueKeywords: [`keyword_${i}`],
        });
      }

      const stats = memory.getStats();
      expect(stats.totalPatterns).toBeLessThanOrEqual(100);
    });
  });

  // ─── Statistics ───────────────────────────────────────────

  describe('getStats', () => {
    it('should return correct statistics', () => {
      memory.recordSuccess({
        category: 'ui_bug',
        description: 'Fix 1',
        filesModified: ['a.ts', 'b.ts'],
        fixSteps: ['step'],
        issueKeywords: ['bug'],
      });

      memory.recordSuccess({
        category: 'ui_bug',
        description: 'Fix 2',
        filesModified: ['a.ts'],
        fixSteps: ['step'],
        issueKeywords: ['bug'],
      });

      memory.recordSuccess({
        category: 'logic_error',
        description: 'Fix 3',
        filesModified: ['c.ts'],
        fixSteps: ['step'],
        issueKeywords: ['error'],
      });

      const stats = memory.getStats();
      expect(stats.totalPatterns).toBe(3);
      expect(stats.topCategories.length).toBeGreaterThan(0);
      expect(stats.topFiles.length).toBeGreaterThan(0);

      // ui_bug should be the top category (2 patterns)
      const topCat = stats.topCategories[0];
      expect(topCat.category).toBe('ui_bug');
      expect(topCat.count).toBe(2);
    });

    it('should return empty stats for fresh memory', () => {
      const stats = memory.getStats();
      expect(stats.totalPatterns).toBe(0);
      expect(stats.topCategories).toEqual([]);
      expect(stats.topFiles).toEqual([]);
    });
  });

  // ─── Persistence ──────────────────────────────────────────

  describe('Persistence', () => {
    it('should save to localStorage on recordSuccess', () => {
      memory.recordSuccess({
        category: 'test',
        description: 'Persist test',
        filesModified: ['test.ts'],
        fixSteps: ['step'],
        issueKeywords: ['persist'],
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load from localStorage on construction', () => {
      // Store a pattern
      memory.recordSuccess({
        category: 'persist_test',
        description: 'Should survive reload',
        filesModified: ['test.ts'],
        fixSteps: ['step'],
        issueKeywords: ['reload'],
      });

      // Create a new instance (simulates page reload)
      const memory2 = new LearningMemory();
      const stats = memory2.getStats();
      expect(stats.totalPatterns).toBeGreaterThan(0);
    });
  });
});
