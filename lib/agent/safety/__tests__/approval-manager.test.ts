/**
 * اختبارات وحدة لـ Approval Manager
 * يغطي: getEffectiveRisk، needsApproval، createApproval، createNotification، generateDescription
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalManager } from '../approval-manager';
import type { ToolCall, ToolDefinition } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────

let manager: ApprovalManager;

beforeEach(() => {
  manager = new ApprovalManager();
});

/**
 * إنشاء tool call وهمي
 */
function createToolCall(
  name: string,
  args: Record<string, unknown> = {}
): ToolCall {
  return {
    id: `tc-${Date.now()}`,
    name,
    arguments: args,
  };
}

/**
 * إنشاء tool definition وهمي
 */
function createToolDef(
  name: string,
  riskLevel: 'auto' | 'notify' | 'confirm'
): ToolDefinition {
  return {
    name,
    description: `Tool: ${name}`,
    parameters: {},
    riskLevel,
    category: name.startsWith('github_')
      ? 'github'
      : name.startsWith('fs_')
        ? 'filesystem'
        : name.startsWith('git_')
          ? 'git'
          : 'utility',
  };
}

// ─── Tests ────────────────────────────────────────────────────

describe('ApprovalManager', () => {
  // ── getEffectiveRisk ──

  describe('getEffectiveRisk', () => {
    it('should use classifyGitHubRisk for github_* tools', () => {
      const tc = createToolCall('github_read_file', {
        owner: 'user',
        repo: 'repo',
        path: 'README.md',
      });
      const def = createToolDef('github_read_file', 'auto');

      const risk = manager.getEffectiveRisk(tc, def);
      // AUTO tools يجب أن تبقى auto
      expect(risk).toBe('auto');
    });

    it('should use classifyRisk for non-github tools', () => {
      const tc = createToolCall('fs_read_file', { filePath: 'index.ts' });
      const def = createToolDef('fs_read_file', 'auto');

      const risk = manager.getEffectiveRisk(tc, def);
      expect(risk).toBe('auto');
    });

    it('should escalate risk for sensitive GitHub paths', () => {
      const tc = createToolCall('github_push_file', {
        owner: 'user',
        repo: 'repo',
        path: '.github/workflows/ci.yml',
      });
      const def = createToolDef('github_push_file', 'notify');

      const risk = manager.getEffectiveRisk(tc, def);
      // .github/workflows/ هو مسار حساس — يجب ترقيته لـ confirm
      expect(risk).toBe('confirm');
    });
  });

  // ── needsApproval ──

  describe('needsApproval', () => {
    it('should return true for CONFIRM-level tools', () => {
      const tc = createToolCall('github_delete_file', {
        owner: 'user',
        repo: 'repo',
        path: 'file.ts',
      });
      const def = createToolDef('github_delete_file', 'confirm');

      expect(manager.needsApproval(tc, def)).toBe(true);
    });

    it('should return false for AUTO-level tools', () => {
      const tc = createToolCall('github_read_file', {
        owner: 'user',
        repo: 'repo',
        path: 'README.md',
      });
      const def = createToolDef('github_read_file', 'auto');

      expect(manager.needsApproval(tc, def)).toBe(false);
    });

    it('should return false for NOTIFY-level tools', () => {
      const tc = createToolCall('fs_create_file', { name: 'new.ts' });
      const def = createToolDef('fs_create_file', 'notify');

      expect(manager.needsApproval(tc, def)).toBe(false);
    });
  });

  // ── needsNotification ──

  describe('needsNotification', () => {
    it('should return true for NOTIFY-level tools', () => {
      const tc = createToolCall('fs_create_file', { name: 'new.ts' });
      const def = createToolDef('fs_create_file', 'notify');

      expect(manager.needsNotification(tc, def)).toBe(true);
    });

    it('should return false for AUTO-level tools', () => {
      const tc = createToolCall('fs_read_file', { filePath: 'index.ts' });
      const def = createToolDef('fs_read_file', 'auto');

      expect(manager.needsNotification(tc, def)).toBe(false);
    });
  });

  // ── isAutoExecute ──

  describe('isAutoExecute', () => {
    it('should return true for AUTO-level tools', () => {
      const tc = createToolCall('git_status', {});
      const def = createToolDef('git_status', 'auto');

      expect(manager.isAutoExecute(tc, def)).toBe(true);
    });

    it('should return false for CONFIRM-level tools', () => {
      const tc = createToolCall('github_delete_repo', {
        owner: 'user',
        repo: 'repo',
      });
      const def = createToolDef('github_delete_repo', 'confirm');

      expect(manager.isAutoExecute(tc, def)).toBe(false);
    });
  });

  // ── createApproval ──

  describe('createApproval', () => {
    it('should return PendingApproval with all required fields', () => {
      const tc = createToolCall('github_delete_file', {
        owner: 'user',
        repo: 'repo',
        path: 'old-file.ts',
      });
      const def = createToolDef('github_delete_file', 'confirm');

      const approval = manager.createApproval(tc, def);

      expect(approval.id).toBeDefined();
      expect(approval.id.length).toBeGreaterThan(0);
      expect(approval.toolName).toBe('github_delete_file');
      expect(approval.status).toBe('pending');
      expect(approval.riskLevel).toBe('confirm');
      expect(approval.createdAt).toBeGreaterThan(0);
    });

    it('should include affected files from tool arguments', () => {
      const tc = createToolCall('github_delete_file', {
        owner: 'user',
        repo: 'repo',
        path: 'src/utils.ts',
      });
      const def = createToolDef('github_delete_file', 'confirm');

      const approval = manager.createApproval(tc, def);
      expect(approval.affectedFiles).toContain('src/utils.ts');
    });

    it('should generate Arabic description', () => {
      const tc = createToolCall('github_delete_file', {
        owner: 'user',
        repo: 'repo',
        path: 'test.ts',
      });
      const def = createToolDef('github_delete_file', 'confirm');

      const approval = manager.createApproval(tc, def);
      expect(approval.description.length).toBeGreaterThan(0);
    });
  });

  // ── createNotification ──

  describe('createNotification', () => {
    it('should return ToolNotification with riskLevel notify', () => {
      const tc = createToolCall('fs_create_file', { name: 'component.tsx' });

      const notification = manager.createNotification(tc);

      expect(notification.riskLevel).toBe('notify');
      expect(notification.toolName).toBe('fs_create_file');
      expect(notification.id).toBeDefined();
      expect(notification.createdAt).toBeGreaterThan(0);
    });

    it('should include description', () => {
      const tc = createToolCall('fs_create_file', { name: 'hello.ts' });
      const notification = manager.createNotification(tc);

      expect(notification.description.length).toBeGreaterThan(0);
    });
  });

  // ── generateDescription (via formatToolSummary) ──

  describe('formatToolSummary', () => {
    it('should format GitHub read operations', () => {
      const tc = createToolCall('github_read_file', {
        owner: 'user',
        repo: 'myrepo',
        path: 'README.md',
      });
      const def = createToolDef('github_read_file', 'auto');

      const summary = manager.formatToolSummary(tc, def);
      expect(summary).toContain('🟢');
      expect(summary).toContain('README.md');
    });

    it('should format destructive operations with warning emoji', () => {
      const tc = createToolCall('github_delete_repo', {
        owner: 'user',
        repo: 'myrepo',
      });
      const def = createToolDef('github_delete_repo', 'confirm');

      const summary = manager.formatToolSummary(tc, def);
      expect(summary).toContain('🔴');
    });

    it('should format FS operations', () => {
      const tc = createToolCall('fs_create_file', { name: 'new.ts' });
      const def = createToolDef('fs_create_file', 'notify');

      const summary = manager.formatToolSummary(tc, def);
      expect(summary).toContain('🟡');
    });

    it('should format git status', () => {
      const tc = createToolCall('git_status', {});
      const def = createToolDef('git_status', 'auto');

      const summary = manager.formatToolSummary(tc, def);
      expect(summary).toContain('🟢');
    });

    it('should handle unknown tools gracefully', () => {
      const tc = createToolCall('unknown_tool', {});

      const summary = manager.formatToolSummary(tc);
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  // ── logDecision ──

  describe('logDecision', () => {
    it('should add entry to audit log', () => {
      const tc = createToolCall('fs_read_file', { filePath: 'index.ts' });

      manager.logDecision(tc, true, 'auto', 'auto');

      const log = manager.getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].toolName).toBe('fs_read_file');
      expect(log[0].approved).toBe(true);
      expect(log[0].approvedBy).toBe('auto');
    });

    it('should log rejected decisions', () => {
      const tc = createToolCall('github_delete_file', { path: 'file.ts' });

      manager.logDecision(tc, false, 'confirm', 'user');

      const log = manager.getAuditLog();
      expect(log[0].approved).toBe(false);
      expect(log[0].approvedBy).toBe('user');
    });

    it('should accumulate multiple log entries', () => {
      const tc1 = createToolCall('fs_read_file', {});
      const tc2 = createToolCall('git_status', {});

      manager.logDecision(tc1, true, 'auto');
      manager.logDecision(tc2, true, 'auto');

      expect(manager.getAuditLog()).toHaveLength(2);
    });
  });
});
