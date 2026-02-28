/**
 * CodeForge IDE — Tool Registry Integration Tests
 * Tests the complete tool registry (v2.3) for integrity and correctness.
 *
 * Tests: 15 total
 * - Registry integrity:     4 tests (total count, no duplicates, all named, all categorized)
 * - Category distribution:  4 tests (exact counts per category, ooda=5, total=58)
 * - Risk level analysis:    2 tests (distribution, ooda risk levels)
 * - Lookup functions:       3 tests (byName, byCategory, byRiskLevel)
 * - Statistics:             2 tests (getToolStats accuracy, category coverage)
 */

import { describe, it, expect, vi } from 'vitest';

// ─── Mock file-operations to prevent DB access ────────────────

vi.mock('@/lib/db/file-operations', () => ({
  getAllNodes: vi.fn().mockResolvedValue([]),
  readFileByPath: vi.fn().mockResolvedValue({ content: '' }),
  updateFileContent: vi.fn().mockResolvedValue(undefined),
  deleteNode: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock agent-service to prevent full initialization ────────

vi.mock('../../agent-service', () => ({
  AgentService: vi.fn().mockImplementation(() => ({
    registerToolExecutor: vi.fn(),
  })),
}));

// ─── Mock OODA internals ──────────────────────────────────────

vi.mock('../ooda-controller', () => ({
  getOODAController: vi.fn().mockReturnValue({
    startImprovement: vi.fn(),
    getTask: vi.fn(),
    getActiveTasks: vi.fn().mockReturnValue([]),
    getHistory: vi.fn().mockReturnValue([]),
    cancelTask: vi.fn(),
  }),
  OODAController: vi.fn(),
}));

vi.mock('../learning-memory', () => ({
  getLearningMemory: vi.fn().mockReturnValue({
    recordSuccess: vi.fn(),
    recordFailure: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    getAllPatterns: vi.fn().mockReturnValue([]),
    findByCategory: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({ totalPatterns: 0 }),
  }),
  LearningMemory: vi.fn(),
}));

vi.mock('../self-analysis-engine', () => ({
  getSelfAnalysisEngine: vi.fn().mockReturnValue({
    analyzeComponent: vi.fn(),
    traceDependencies: vi.fn(),
    buildProjectMap: vi.fn(),
    findRelatedFiles: vi.fn(),
  }),
  SelfAnalysisEngine: vi.fn(),
}));

// ─── Import after mocks ──────────────────────────────────────

import {
  getAllTools,
  getToolByName,
  getToolsByCategory,
  getToolsByRiskLevel,
  getToolStats,
} from '../../tools/index';

import type { ToolDefinition } from '../../types';

// ─── Tests ────────────────────────────────────────────────────

describe('Tool Registry v2.3 — Integration', () => {
  let allTools: ToolDefinition[];

  beforeAll(() => {
    allTools = getAllTools();
  });

  // ═══════════════════════════════════════════════════════════
  // Registry Integrity
  // ═══════════════════════════════════════════════════════════

  describe('Registry Integrity', () => {
    it('should have exactly 58 tools total', () => {
      expect(allTools.length).toBe(58);
    });

    it('should have no duplicate tool names', () => {
      const names = allTools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have all tools with non-empty names', () => {
      for (const tool of allTools) {
        expect(tool.name).toBeDefined();
        expect(tool.name.length).toBeGreaterThan(0);
      }
    });

    it('should have all tools with valid categories', () => {
      const validCategories = [
        'filesystem',
        'git',
        'github',
        'utility',
        'self-improve',
        'ooda',
      ];
      for (const tool of allTools) {
        expect(validCategories).toContain(tool.category);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Category Distribution
  // ═══════════════════════════════════════════════════════════

  describe('Category Distribution', () => {
    it('should have 9 filesystem tools', () => {
      const fsTools = allTools.filter((t) => t.category === 'filesystem');
      expect(fsTools.length).toBe(9);
      expect(fsTools.every((t) => t.name.startsWith('fs_'))).toBe(true);
    });

    it('should have 8 git tools', () => {
      const gitTools = allTools.filter((t) => t.category === 'git');
      expect(gitTools.length).toBe(8);
      expect(gitTools.every((t) => t.name.startsWith('git_'))).toBe(true);
    });

    it('should have 25 github tools', () => {
      const ghTools = allTools.filter((t) => t.category === 'github');
      expect(ghTools.length).toBe(25);
      expect(ghTools.every((t) => t.name.startsWith('github_'))).toBe(true);
    });

    it('should have 5 ooda tools with ooda_ prefix', () => {
      const oodaTools = allTools.filter((t) => t.category === 'ooda');
      expect(oodaTools.length).toBe(5);
      expect(oodaTools.every((t) => t.name.startsWith('ooda_'))).toBe(true);

      const expectedNames = [
        'ooda_start_cycle',
        'ooda_execute_fix',
        'ooda_verify_fix',
        'ooda_learn_pattern',
        'ooda_get_status',
      ];
      const actualNames = oodaTools.map((t) => t.name).sort();
      expect(actualNames).toEqual(expectedNames.sort());
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Risk Level Analysis
  // ═══════════════════════════════════════════════════════════

  describe('Risk Level Analysis', () => {
    it('should have valid risk levels for all tools', () => {
      const validRiskLevels = ['auto', 'notify', 'confirm'];
      for (const tool of allTools) {
        expect(validRiskLevels).toContain(tool.riskLevel);
      }
    });

    it('should have correct risk levels for ooda tools', () => {
      const oodaTools = allTools.filter((t) => t.category === 'ooda');
      const riskMap: Record<string, string> = {};
      for (const t of oodaTools) riskMap[t.name] = t.riskLevel;

      expect(riskMap['ooda_start_cycle']).toBe('notify');
      expect(riskMap['ooda_execute_fix']).toBe('notify');
      expect(riskMap['ooda_verify_fix']).toBe('auto');
      expect(riskMap['ooda_learn_pattern']).toBe('notify');
      expect(riskMap['ooda_get_status']).toBe('auto');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Lookup Functions
  // ═══════════════════════════════════════════════════════════

  describe('Lookup Functions', () => {
    it('should find tools by exact name', () => {
      const tool = getToolByName('ooda_start_cycle');
      expect(tool).toBeDefined();
      expect(tool!.name).toBe('ooda_start_cycle');
      expect(tool!.category).toBe('ooda');

      const fsTool = getToolByName('fs_read_file');
      expect(fsTool).toBeDefined();
      expect(fsTool!.category).toBe('filesystem');

      expect(getToolByName('nonexistent_tool')).toBeUndefined();
    });

    it('should filter tools by category', () => {
      const oodaTools = getToolsByCategory('ooda');
      expect(oodaTools.length).toBe(5);
      expect(oodaTools.every((t) => t.category === 'ooda')).toBe(true);

      const selfTools = getToolsByCategory('self-improve');
      expect(selfTools.length).toBe(8);
    });

    it('should filter tools by risk level', () => {
      const autoTools = getToolsByRiskLevel('auto');
      const notifyTools = getToolsByRiskLevel('notify');
      const confirmTools = getToolsByRiskLevel('confirm');

      expect(autoTools.length + notifyTools.length + confirmTools.length).toBe(
        58
      );
      expect(autoTools.length).toBeGreaterThan(0);
      expect(notifyTools.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════

  describe('Statistics', () => {
    it('should return accurate tool statistics', () => {
      const stats = getToolStats();
      expect(stats.total).toBe(58);

      expect(stats.byCategory['filesystem']).toBe(9);
      expect(stats.byCategory['git']).toBe(8);
      expect(stats.byCategory['github']).toBe(25);
      expect(stats.byCategory['utility']).toBe(3);
      expect(stats.byCategory['self-improve']).toBe(8);
      expect(stats.byCategory['ooda']).toBe(5);
    });

    it('should cover all 6 categories in stats', () => {
      const stats = getToolStats();
      const categories = Object.keys(stats.byCategory);
      expect(categories.length).toBe(6);
      expect(categories).toContain('ooda');

      // Sum of all categories should equal total
      const categorySum = Object.values(stats.byCategory).reduce(
        (a, b) => a + b,
        0
      );
      expect(categorySum).toBe(stats.total);
    });
  });
});
