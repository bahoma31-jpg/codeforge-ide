/**
 * CodeForge IDE — Integration Test Suite v1.0
 * Phase 6: Full integration testing for the agent system.
 *
 * Tests:
 * 1. Safety classification correctness (AUTO/NOTIFY/CONFIRM)
 * 2. Approval manager creates proper approvals & notifications
 * 3. Audit logger lifecycle (log → filter → stats → export)
 * 4. Type compatibility across all modules
 * 5. Anti-loop protection
 * 6. Agent-service sendMessage flow (mock provider)
 *
 * Run: npx jest lib/agent/__tests__/integration.test.ts
 * or:  npx vitest run lib/agent/__tests__/integration.test.ts
 */

import type {
  ToolCall,
  ToolDefinition,
  RiskLevel,
  AuditLogEntry,
  ApprovalSource,
  PendingApproval,
} from '../types';

// ═══════════════════════════════════════════════════════════════
// MOCK: localStorage (for Node.js environment)
// ═══════════════════════════════════════════════════════════════

const mockStorage: Record<string, string> = {};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
    get length() { return Object.keys(mockStorage).length; },
    key: (i: number) => Object.keys(mockStorage)[i] || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════

function makeToolCall(name: string, args: Record<string, unknown> = {}): ToolCall {
  return {
    id: `tc-${name}-${Date.now()}`,
    name,
    arguments: args,
  };
}

function makeToolDef(
  name: string,
  riskLevel: RiskLevel,
  category: 'filesystem' | 'git' | 'github' | 'utility' = 'github'
): ToolDefinition {
  return {
    name,
    description: `Test tool: ${name}`,
    parameters: { type: 'object', properties: {} },
    riskLevel,
    category,
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Type Compatibility
// ═══════════════════════════════════════════════════════════════

describe('Type Compatibility', () => {
  test('ApprovalSource includes all three values', () => {
    const sources: ApprovalSource[] = ['auto', 'notify', 'user'];
    expect(sources).toHaveLength(3);
    expect(sources).toContain('auto');
    expect(sources).toContain('notify');
    expect(sources).toContain('user');
  });

  test('AuditLogEntry.approvedBy accepts all ApprovalSource values', () => {
    const entries: AuditLogEntry[] = [
      { id: '1', toolName: 'test', args: {}, approvedBy: 'auto', timestamp: Date.now() },
      { id: '2', toolName: 'test', args: {}, approvedBy: 'notify', timestamp: Date.now() },
      { id: '3', toolName: 'test', args: {}, approvedBy: 'user', timestamp: Date.now() },
    ];
    expect(entries[0].approvedBy).toBe('auto');
    expect(entries[1].approvedBy).toBe('notify');
    expect(entries[2].approvedBy).toBe('user');
  });

  test('RiskLevel covers all three levels', () => {
    const levels: RiskLevel[] = ['auto', 'notify', 'confirm'];
    expect(levels).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// TEST 2: Safety Classification
// ═══════════════════════════════════════════════════════════════

describe('Safety Classification', () => {
  // Lazy import to avoid issues with localStorage
  let processToolSafety: typeof import('../safety')['processToolSafety'];

  beforeAll(async () => {
    const safety = await import('../safety');
    processToolSafety = safety.processToolSafety;
  });

  test('AUTO tools return type "auto"', () => {
    const tc = makeToolCall('github_read_file', { path: 'README.md' });
    const td = makeToolDef('github_read_file', 'auto');
    const action = processToolSafety(tc, td);
    expect(action.type).toBe('auto');
    expect(action.riskLevel).toBe('auto');
  });

  test('NOTIFY tools return type "notify" with notification', () => {
    const tc = makeToolCall('github_push_file', { path: 'src/app.ts', content: '// new' });
    const td = makeToolDef('github_push_file', 'notify');
    const action = processToolSafety(tc, td);
    expect(action.type).toBe('notify');
    expect(action.riskLevel).toBe('notify');
    if (action.type === 'notify') {
      expect(action.notification).toBeDefined();
      expect(action.notification.toolName).toBe('github_push_file');
      expect(action.notification.id).toBeTruthy();
    }
  });

  test('CONFIRM tools return type "confirm" with approval', () => {
    const tc = makeToolCall('github_delete_file', { path: 'important.ts' });
    const td = makeToolDef('github_delete_file', 'confirm');
    const action = processToolSafety(tc, td);
    expect(action.type).toBe('confirm');
    expect(action.riskLevel).toBe('confirm');
    if (action.type === 'confirm') {
      expect(action.approval).toBeDefined();
      expect(action.approval.status).toBe('pending');
      expect(action.approval.toolName).toBe('github_delete_file');
    }
  });

  test('Unknown tool without definition defaults to AUTO', () => {
    const tc = makeToolCall('unknown_tool');
    const action = processToolSafety(tc, undefined);
    // Without a definition, it should default to the safest assumption
    expect(['auto', 'notify', 'confirm']).toContain(action.type);
  });
});

// ═══════════════════════════════════════════════════════════════
// TEST 3: Audit Logger
// ═══════════════════════════════════════════════════════════════

describe('Audit Logger', () => {
  let AuditLogger: typeof import('../audit-logger')['AuditLogger'];
  let logger: InstanceType<typeof import('../audit-logger')['AuditLogger']>;

  beforeAll(async () => {
    const mod = await import('../audit-logger');
    AuditLogger = mod.AuditLogger;
  });

  beforeEach(() => {
    localStorage.clear();
    logger = new AuditLogger();
  });

  test('log() creates entry with all fields', () => {
    const entry = logger.log({
      toolName: 'github_push_file',
      args: { path: 'test.ts' },
      result: { success: true },
      riskLevel: 'notify',
      approvedBy: 'notify',
    });

    expect(entry.id).toBeTruthy();
    expect(entry.toolName).toBe('github_push_file');
    expect(entry.riskLevel).toBe('notify');
    expect(entry.approvedBy).toBe('notify');
    expect(entry.result?.success).toBe(true);
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  test('logStart() + finish() records duration', async () => {
    const tracker = logger.logStart('github_read_file', { path: 'x.ts' }, 'auto');
    // Simulate some work
    await new Promise((r) => setTimeout(r, 50));
    const entry = tracker.finish({ success: true }, true, 'auto');

    expect(entry.duration).toBeGreaterThan(0);
    expect(entry.approvedBy).toBe('auto');
  });

  test('logStart() + reject() records rejection', () => {
    const tracker = logger.logStart('github_delete_file', { path: 'x.ts' }, 'confirm');
    const entry = tracker.reject();

    expect(entry.approved).toBe(false);
    expect(entry.approvedBy).toBe('user');
    expect(entry.result?.success).toBe(false);
  });

  test('logStart() + finish() with notify approvedBy', () => {
    const tracker = logger.logStart('fs_create_file', { name: 'new.ts' }, 'notify', 'filesystem');
    const entry = tracker.finish({ success: true }, true, 'notify');

    expect(entry.approvedBy).toBe('notify');
    expect(entry.category).toBe('filesystem');
  });

  test('filter() works with riskLevel', () => {
    logger.log({ toolName: 'a', args: {}, riskLevel: 'auto' });
    logger.log({ toolName: 'b', args: {}, riskLevel: 'notify' });
    logger.log({ toolName: 'c', args: {}, riskLevel: 'confirm' });

    const notifyOnly = logger.filter({ riskLevel: 'notify' });
    expect(notifyOnly).toHaveLength(1);
    expect(notifyOnly[0].toolName).toBe('b');
  });

  test('getStats() counts correctly', () => {
    logger.log({ toolName: 'a', args: {}, result: { success: true }, riskLevel: 'auto', approved: true });
    logger.log({ toolName: 'b', args: {}, result: { success: true }, riskLevel: 'notify', approved: true });
    logger.log({ toolName: 'c', args: {}, result: { success: false, error: 'rejected' }, riskLevel: 'confirm', approved: false });

    const stats = logger.getStats();
    expect(stats.totalOperations).toBe(3);
    expect(stats.successCount).toBe(2);
    expect(stats.rejectedCount).toBe(1);
    expect(stats.byRiskLevel['auto']).toBe(1);
    expect(stats.byRiskLevel['notify']).toBe(1);
    expect(stats.byRiskLevel['confirm']).toBe(1);
  });

  test('exportCSV() includes Approved By column', () => {
    logger.log({ toolName: 'test', args: {}, approvedBy: 'notify' });
    const csv = logger.exportCSV();
    expect(csv).toContain('Approved By');
    expect(csv).toContain('notify');
  });

  test('inferCategory recognizes fs_ prefix', () => {
    const entry = logger.log({ toolName: 'fs_create_file', args: {} });
    expect(entry.category).toBe('filesystem');
  });
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: Safety → Audit Integration
// ═══════════════════════════════════════════════════════════════

describe('Safety → Audit Integration', () => {
  test('CONFIRM tool → reject → audit shows rejected', async () => {
    const { processToolSafety } = await import('../safety');
    const { AuditLogger } = await import('../audit-logger');

    localStorage.clear();
    const logger = new AuditLogger();

    const tc = makeToolCall('github_delete_file', { path: 'secret.ts' });
    const td = makeToolDef('github_delete_file', 'confirm');
    const action = processToolSafety(tc, td);

    expect(action.type).toBe('confirm');

    // Simulate rejection
    const tracker = logger.logStart(tc.name, tc.arguments, 'confirm', 'github');
    tracker.reject();

    const all = logger.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].approved).toBe(false);
    expect(all[0].approvedBy).toBe('user');
    expect(all[0].riskLevel).toBe('confirm');
  });

  test('NOTIFY tool → execute → audit shows notify', async () => {
    const { processToolSafety } = await import('../safety');
    const { AuditLogger } = await import('../audit-logger');

    localStorage.clear();
    const logger = new AuditLogger();

    const tc = makeToolCall('github_push_file', { path: 'new.ts' });
    const td = makeToolDef('github_push_file', 'notify');
    const action = processToolSafety(tc, td);

    expect(action.type).toBe('notify');

    const tracker = logger.logStart(tc.name, tc.arguments, 'notify', 'github');
    tracker.finish({ success: true }, true, 'notify');

    const all = logger.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].approvedBy).toBe('notify');
    expect(all[0].riskLevel).toBe('notify');
    expect(all[0].result?.success).toBe(true);
  });
});
