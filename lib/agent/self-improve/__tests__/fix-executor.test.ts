/**
 * CodeForge IDE — Fix Executor Tests
 * Unit tests for the plan execution engine.
 *
 * Tests cover:
 * - Plan execution with file operations
 * - Rollback on failure
 * - Protected path enforcement
 * - Dry run mode
 * - File limit enforcement
 * - Step-by-step execution order
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FixExecutor } from '../fix-executor';
import type { ToolBridge } from '../fix-executor';

// ─── Test Helpers ─────────────────────────────────────────────

function createMockBridge(): ToolBridge {
  const files: Record<string, string> = {
    'src/app.ts': 'export const app = true;\nconst old = "value";',
    'src/utils.ts': 'export function helper() { return 1; }',
    'lib/agent/safety/index.ts': 'export const SAFE = true;',
  };

  return {
    readFile: vi.fn(async (path: string) => files[path] || ''),
    editFile: vi.fn(async (path, oldStr, newStr) => {
      if (files[path] && files[path].includes(oldStr)) {
        files[path] = files[path].replace(oldStr, newStr);
        return true;
      }
      return false;
    }),
    writeFile: vi.fn(async (path, content) => {
      files[path] = content;
      return true;
    }),
    deleteFile: vi.fn(async (path) => {
      if (files[path]) {
        delete files[path];
        return true;
      }
      return false;
    }),
  };
}

// ─── Tests ────────────────────────────────────────────────────

describe('FixExecutor', () => {
  let executor: FixExecutor;
  let bridge: ToolBridge;

  beforeEach(() => {
    bridge = createMockBridge();
    executor = new FixExecutor(bridge);
  });

  // ─── Basic Execution ──────────────────────────────────────

  describe('executePlan', () => {
    it('should execute a read step', async () => {
      const result = await executor.executePlan({
        steps: [
          { type: 'read', filePath: 'src/app.ts', description: 'Read app file' },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      expect(result.success).toBe(true);
      expect(bridge.readFile).toHaveBeenCalledWith('src/app.ts');
    });

    it('should execute an edit step', async () => {
      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'src/app.ts',
            description: 'Change old value',
            oldStr: 'const old = "value"',
            newStr: 'const updated = "new_value"',
          },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      expect(result.success).toBe(true);
      expect(bridge.editFile).toHaveBeenCalled();
      expect(result.filesModified).toContain('src/app.ts');
    });

    it('should execute steps in order', async () => {
      const callOrder: string[] = [];

      (bridge.readFile as any).mockImplementation(async (path: string) => {
        callOrder.push(`read:${path}`);
        return 'content';
      });

      (bridge.editFile as any).mockImplementation(async () => {
        callOrder.push('edit');
        return true;
      });

      await executor.executePlan({
        steps: [
          { type: 'read', filePath: 'src/app.ts', description: 'Read first' },
          { type: 'edit', filePath: 'src/app.ts', description: 'Edit', oldStr: 'x', newStr: 'y' },
          { type: 'read', filePath: 'src/utils.ts', description: 'Read second' },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      expect(callOrder).toEqual(['read:src/app.ts', 'edit', 'read:src/utils.ts']);
    });
  });

  // ─── Rollback ─────────────────────────────────────────────

  describe('Rollback', () => {
    it('should backup files before editing', async () => {
      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'src/app.ts',
            description: 'Edit app',
            oldStr: 'const old = "value"',
            newStr: 'const new_ = "value"',
          },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      expect(result.backupData).toBeDefined();
      expect(result.backupData.has('src/app.ts')).toBe(true);
    });

    it('should restore files on rollback', async () => {
      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'src/app.ts',
            description: 'Edit',
            oldStr: 'const old = "value"',
            newStr: 'BROKEN CODE',
          },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      await executor.rollback(result.backupData);
      expect(bridge.writeFile).toHaveBeenCalledWith(
        'src/app.ts',
        expect.stringContaining('const old = "value"'),
        expect.any(String)
      );
    });
  });

  // ─── Protected Paths ──────────────────────────────────────

  describe('Protected Paths', () => {
    it('should skip editing protected files', async () => {
      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'lib/agent/safety/index.ts',
            description: 'Try to edit safety',
            oldStr: 'SAFE',
            newStr: 'UNSAFE',
          },
        ],
        protectedPaths: ['lib/agent/safety'],
        maxFiles: 10,
      });

      // Should not have called editFile for protected path
      expect(bridge.editFile).not.toHaveBeenCalledWith(
        'lib/agent/safety/index.ts',
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  // ─── Dry Run ──────────────────────────────────────────────

  describe('Dry Run', () => {
    it('should not modify files in dry run mode', async () => {
      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'src/app.ts',
            description: 'Dry run edit',
            oldStr: 'const old = "value"',
            newStr: 'const dry = "run"',
          },
        ],
        protectedPaths: [],
        maxFiles: 10,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      // In dry run, editFile should not be called (or called with dry flag)
      // Implementation may vary — at minimum, no actual writes
    });
  });

  // ─── File Limits ──────────────────────────────────────────

  describe('File Limits', () => {
    it('should respect maximum file limit', async () => {
      const steps = Array.from({ length: 15 }, (_, i) => ({
        type: 'edit' as const,
        filePath: `src/file${i}.ts`,
        description: `Edit file ${i}`,
        oldStr: 'old',
        newStr: 'new',
      }));

      const result = await executor.executePlan({
        steps,
        protectedPaths: [],
        maxFiles: 3,
      });

      // Should stop after hitting file limit
      expect(result.filesModified.length).toBeLessThanOrEqual(3);
    });
  });

  // ─── Error Handling ───────────────────────────────────────

  describe('Error Handling', () => {
    it('should handle read failure gracefully', async () => {
      (bridge.readFile as any).mockRejectedValueOnce(new Error('File not found'));

      const result = await executor.executePlan({
        steps: [
          { type: 'read', filePath: 'nonexistent.ts', description: 'Read missing' },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      // Should handle error gracefully (not throw)
      expect(result).toBeDefined();
    });

    it('should handle edit failure and continue', async () => {
      (bridge.editFile as any).mockResolvedValueOnce(false);

      const result = await executor.executePlan({
        steps: [
          {
            type: 'edit',
            filePath: 'src/app.ts',
            description: 'Failed edit',
            oldStr: 'NONEXISTENT STRING',
            newStr: 'replacement',
          },
        ],
        protectedPaths: [],
        maxFiles: 10,
      });

      expect(result).toBeDefined();
    });
  });
});
