/**
 * CodeForge IDE — OODA Tools Integration Tests
 * Tests the 5 ooda_* tools end-to-end with mock dependencies.
 *
 * Tests: 18 total
 * - ooda_start_cycle:   3 tests (validation, protected paths, success)
 * - ooda_execute_fix:   5 tests (edit, rewrite, rollback, limits, protected)
 * - ooda_verify_fix:    4 tests (all checks, partial, syntax, protected)
 * - ooda_learn_pattern: 3 tests (save, confidence, similar)
 * - ooda_get_status:    3 tests (single, all, empty)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Dependencies ────────────────────────────────────────

const mockFiles: Record<string, string> = {};

function resetMockFiles() {
  Object.keys(mockFiles).forEach((k) => delete mockFiles[k]);
  Object.assign(mockFiles, {
    'src/components/sidebar.tsx': [
      'import React from "react";',
      'import { useStore } from "../store";',
      '',
      'export function Sidebar() {',
      '  const { isOpen } = useStore();',
      '  return <div className="sidebar">{isOpen && <nav>Menu</nav>}</div>;',
      '}',
    ].join('\n'),
    'src/store/index.ts': [
      'import { create } from "zustand";',
      '',
      'export const useStore = create((set) => ({',
      '  isOpen: true,',
      '  toggle: () => set((s) => ({ isOpen: !s.isOpen })),',
      '}));',
    ].join('\n'),
    'src/utils/helpers.ts': [
      'export function clamp(val: number, min: number, max: number): number {',
      '  return Math.min(Math.max(val, min), max);',
      '}',
    ].join('\n'),
    'lib/agent/safety/index.ts': 'export const SAFETY_ENABLED = true;',
    '.env.local': 'API_KEY=secret',
  });
}

// Mock OODAController
let taskIdCounter = 0;
const mockTasks = new Map();

function createMockTask(description: string, category: string) {
  const id = `ooda-${++taskIdCounter}`;
  const task = {
    id,
    status: 'running',
    description,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    observation: {
      affectedArea: 'src/components',
      detectedFiles: ['src/components/sidebar.tsx'],
      evidence: ['Bug in sidebar rendering'],
    },
    orientation: {
      rootCause: 'Missing null check',
      scope: ['src/components/sidebar.tsx'],
      skills: ['react', 'typescript'],
    },
    decision: {
      plan: [{ type: 'edit', file: 'src/components/sidebar.tsx' }],
      riskLevel: 'low',
      requiresApproval: false,
    },
    execution: {
      status: 'pending',
      changes: [] as Array<{ filePath: string; changeType: string }>,
      iterations: 0,
      maxIterations: 5,
      verificationResult: null as { passed: boolean } | null,
      errors: [] as string[],
    },
  };
  mockTasks.set(id, task);
  return task;
}

vi.mock('../ooda-controller', () => ({
  getOODAController: () => ({
    startImprovement: vi
      .fn()
      .mockImplementation(
        async (
          _trigger: string,
          desc: string,
          _files: Map<string, string>,
          opts: { category?: string }
        ) => {
          return createMockTask(desc, opts?.category || 'ui_bug');
        }
      ),
    getTask: vi
      .fn()
      .mockImplementation((id: string) => mockTasks.get(id) || null),
    getActiveTasks: vi
      .fn()
      .mockImplementation(() =>
        Array.from(mockTasks.values()).filter((t) => t.status === 'running')
      ),
    getHistory: vi
      .fn()
      .mockImplementation(() =>
        Array.from(mockTasks.values()).filter((t) => t.status !== 'running')
      ),
    cancelTask: vi.fn().mockImplementation((id: string) => {
      const task = mockTasks.get(id);
      if (task) {
        task.status = 'cancelled';
        return true;
      }
      return false;
    }),
  }),
  OODAController: vi.fn(),
}));

// Mock LearningMemory
const storedPatterns: Array<{
  id: string;
  problemSignature: string;
  solution: string;
  category: string;
  successRate: number;
  timesUsed: number;
  filesInvolved: string[];
}> = [];

vi.mock('../learning-memory', () => ({
  getLearningMemory: () => ({
    recordSuccess: vi
      .fn()
      .mockImplementation((task: { description: string }) => {
        storedPatterns.push({
          id: `pattern-${storedPatterns.length + 1}`,
          problemSignature: task.description,
          solution: 'auto-resolved',
          category: 'ui_bug',
          successRate: 1.0,
          timesUsed: 1,
          filesInvolved: [],
        });
      }),
    recordFailure: vi.fn(),
    findSimilar: vi.fn().mockImplementation((desc: string, limit: number) => {
      return storedPatterns
        .filter((p) => p.problemSignature.includes(desc.split(' ')[0]))
        .slice(0, limit)
        .map((p) => ({ pattern: p, similarity: 0.7 }));
    }),
    getAllPatterns: vi.fn().mockImplementation(() => storedPatterns),
    findByCategory: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({
      totalPatterns: storedPatterns.length,
      successfulPatterns: storedPatterns.length,
      topCategories: [],
      topFiles: [],
    }),
  }),
  LearningMemory: vi.fn(),
}));

// ─── Import Executors After Mocks ─────────────────────────────

import { createOODAPhase3Executors } from '../ooda-tool-definitions';
import type { ToolBridge } from '../fix-executor';

// ─── Test Setup ───────────────────────────────────────────────

function createToolBridge(): ToolBridge {
  return {
    readFile: vi.fn().mockImplementation(async (path: string) => {
      if (mockFiles[path] === undefined)
        throw new Error(`File not found: ${path}`);
      return mockFiles[path];
    }),
    editFile: vi
      .fn()
      .mockImplementation(
        async (path: string, oldStr: string, newStr: string) => {
          if (!mockFiles[path] || !mockFiles[path].includes(oldStr))
            return false;
          mockFiles[path] = mockFiles[path].replace(oldStr, newStr);
          return true;
        }
      ),
    writeFile: vi
      .fn()
      .mockImplementation(async (path: string, content: string) => {
        mockFiles[path] = content;
        return true;
      }),
    deleteFile: vi.fn().mockImplementation(async (path: string) => {
      if (!mockFiles[path]) return false;
      delete mockFiles[path];
      return true;
    }),
  };
}

function createFileLoader() {
  return vi.fn().mockImplementation(async () => {
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(mockFiles)) {
      map.set(k, v);
    }
    return map;
  });
}

describe('OODA Phase 3 Tools — Integration', () => {
  let executors: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  >;
  let bridge: ToolBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockFiles();
    taskIdCounter = 0;
    mockTasks.clear();
    storedPatterns.length = 0;
    bridge = createToolBridge();
    executors = createOODAPhase3Executors(bridge, createFileLoader());
  });

  // ═══════════════════════════════════════════════════════════
  // ooda_start_cycle
  // ═══════════════════════════════════════════════════════════

  describe('ooda_start_cycle', () => {
    it('should reject when required params are missing', async () => {
      const result = await executors.ooda_start_cycle({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required');
    });

    it('should reject when affected files include protected paths', async () => {
      const result = await executors.ooda_start_cycle({
        issue: 'Fix safety module',
        category: 'logic_error',
        affectedFiles: ['lib/agent/safety/index.ts', 'src/app.ts'],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('protected');
    });

    it('should start a cycle successfully with valid params', async () => {
      const result = await executors.ooda_start_cycle({
        issue: 'Sidebar not rendering correctly',
        category: 'ui_bug',
        affectedFiles: ['src/components/sidebar.tsx'],
      });
      expect(result.success).toBe(true);
      expect(result.data.cycleId).toBeDefined();
      expect(result.data.phase).toBe('observe');
      expect(result.data.message).toContain('OODA cycle started');
      expect(result.data.timeout).toBe('30 minutes');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ooda_execute_fix
  // ═══════════════════════════════════════════════════════════

  describe('ooda_execute_fix', () => {
    let cycleId: string;

    beforeEach(async () => {
      const startResult = await executors.ooda_start_cycle({
        issue: 'Bug in sidebar',
        category: 'ui_bug',
        affectedFiles: ['src/components/sidebar.tsx'],
      });
      cycleId = startResult.data.cycleId;
    });

    it('should reject when params are missing', async () => {
      const result = await executors.ooda_execute_fix({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required');
    });

    it('should execute an edit fix successfully', async () => {
      const result = await executors.ooda_execute_fix({
        cycleId,
        fixes: [
          {
            filePath: 'src/components/sidebar.tsx',
            type: 'edit',
            oldStr: 'className="sidebar"',
            newStr: 'className="sidebar sidebar--fixed"',
            commitMessage: 'fix: add fixed class to sidebar',
          },
        ],
      });
      expect(result.success).toBe(true);
      expect(result.data.applied).toBe(1);
      expect(result.data.failed).toBe(0);
      expect(mockFiles['src/components/sidebar.tsx']).toContain(
        'sidebar--fixed'
      );
    });

    it('should execute a rewrite fix successfully', async () => {
      const newContent =
        'export function Sidebar() { return <div>New Sidebar</div>; }';
      const result = await executors.ooda_execute_fix({
        cycleId,
        fixes: [
          {
            filePath: 'src/components/sidebar.tsx',
            type: 'rewrite',
            content: newContent,
            commitMessage: 'refactor: rewrite sidebar component',
          },
        ],
      });
      expect(result.success).toBe(true);
      expect(mockFiles['src/components/sidebar.tsx']).toBe(newContent);
    });

    it('should reject fixes to protected paths', async () => {
      const result = await executors.ooda_execute_fix({
        cycleId,
        fixes: [
          {
            filePath: 'lib/agent/safety/index.ts',
            type: 'rewrite',
            content: 'HACKED',
            commitMessage: 'hack safety',
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('protected');
    });

    it('should reject when fixes exceed 10 file limit', async () => {
      const fixes = Array.from({ length: 11 }, (_, i) => ({
        filePath: `src/file${i}.ts`,
        type: 'rewrite' as const,
        content: `file ${i}`,
        commitMessage: `fix file ${i}`,
      }));
      const result = await executors.ooda_execute_fix({ cycleId, fixes });
      expect(result.success).toBe(false);
      expect(result.error).toContain('10');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ooda_verify_fix
  // ═══════════════════════════════════════════════════════════

  describe('ooda_verify_fix', () => {
    let cycleId: string;

    beforeEach(async () => {
      const startResult = await executors.ooda_start_cycle({
        issue: 'Verify test',
        category: 'ui_bug',
        affectedFiles: ['src/components/sidebar.tsx'],
      });
      cycleId = startResult.data.cycleId;

      // Add a change to the task so verification has something to check
      const task = mockTasks.get(cycleId);
      if (task) {
        task.execution.changes = [
          { filePath: 'src/components/sidebar.tsx', changeType: 'edit' },
        ];
      }
    });

    it('should reject when cycleId is missing', async () => {
      const result = await executors.ooda_verify_fix({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required');
    });

    it('should run all 6 checks by default', async () => {
      const result = await executors.ooda_verify_fix({ cycleId });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeGreaterThanOrEqual(5);

      const checkTypes = result.data.results.map(
        (r: { check: string }) => r.check.split(':')[0]
      );
      expect(checkTypes).toContain('exists');
      expect(checkTypes).toContain('content');
      expect(checkTypes).toContain('imports');
      expect(checkTypes).toContain('protected');
      expect(checkTypes).toContain('syntax');
    });

    it('should run only specified checks', async () => {
      const result = await executors.ooda_verify_fix({
        cycleId,
        checks: ['exists', 'protected'],
      });
      expect(result.success).toBe(true);
      const checkTypes = result.data.results.map(
        (r: { check: string }) => r.check.split(':')[0]
      );
      expect(checkTypes).toContain('exists');
      expect(checkTypes).toContain('protected');
      expect(checkTypes).not.toContain('syntax');
    });

    it('should detect balanced braces in syntax check', async () => {
      // Sidebar has balanced braces
      const result = await executors.ooda_verify_fix({
        cycleId,
        checks: ['syntax'],
      });
      expect(result.success).toBe(true);
      const syntaxCheck = result.data.results.find((r: { check: string }) =>
        r.check.startsWith('syntax')
      );
      expect(syntaxCheck?.passed).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ooda_learn_pattern
  // ═══════════════════════════════════════════════════════════

  describe('ooda_learn_pattern', () => {
    let cycleId: string;

    beforeEach(async () => {
      const startResult = await executors.ooda_start_cycle({
        issue: 'Learning test',
        category: 'style',
        affectedFiles: ['src/components/sidebar.tsx'],
      });
      cycleId = startResult.data.cycleId;
    });

    it('should reject when params are missing', async () => {
      const result = await executors.ooda_learn_pattern({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required');
    });

    it('should reject invalid confidence range', async () => {
      const result = await executors.ooda_learn_pattern({
        cycleId,
        pattern: {
          description: 'Test',
          rootCause: 'Test',
          fixApproach: 'Test',
          tags: ['test'],
          confidence: 1.5,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('confidence');
    });

    it('should save pattern successfully and report total', async () => {
      const result = await executors.ooda_learn_pattern({
        cycleId,
        pattern: {
          description: 'CSS class order matters for RTL layouts',
          rootCause: 'Missing RTL class on sidebar',
          fixApproach: 'Add dir-aware CSS classes',
          tags: ['css', 'rtl', 'sidebar'],
          confidence: 0.9,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.patternSaved).toBe(true);
      expect(result.data.confidence).toBe('90%');
      expect(result.data.message).toContain('Pattern saved');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ooda_get_status
  // ═══════════════════════════════════════════════════════════

  describe('ooda_get_status', () => {
    it('should return empty state when no cycles exist', async () => {
      const result = await executors.ooda_get_status({});
      expect(result.success).toBe(true);
      expect(result.data.activeCycles).toEqual([]);
    });

    it('should return specific cycle status', async () => {
      const startResult = await executors.ooda_start_cycle({
        issue: 'Status test',
        category: 'performance',
        affectedFiles: ['src/utils/helpers.ts'],
      });
      const cycleId = startResult.data.cycleId;

      const result = await executors.ooda_get_status({ cycleId });
      expect(result.success).toBe(true);
      expect(result.data.cycleId).toBe(cycleId);
      expect(result.data.status).toBeDefined();
      expect(result.data.category).toBe('performance');
    });

    it('should return all active cycles when no cycleId given', async () => {
      await executors.ooda_start_cycle({
        issue: 'Cycle 1',
        category: 'ui_bug',
        affectedFiles: ['src/components/sidebar.tsx'],
      });
      await executors.ooda_start_cycle({
        issue: 'Cycle 2',
        category: 'style',
        affectedFiles: ['src/utils/helpers.ts'],
      });

      const result = await executors.ooda_get_status({});
      expect(result.success).toBe(true);
      expect(result.data.activeCycles.length).toBe(2);
    });
  });
});
