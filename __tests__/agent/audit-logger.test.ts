/**
 * CodeForge IDE — Audit Logger Unit Tests
 * Tests for the persistent audit logging system.
 *
 * Run: npx jest __tests__/agent/audit-logger.test.ts
 */

import { AuditLogger, type AuditLogFilter } from '../../lib/agent/audit-logger';

// ─── Mock localStorage ────────────────────────────────────────

const store: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  },
});

// ─── Tests ────────────────────────────────────────────────────

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    logger = new AuditLogger();
  });

  // ── Core Logging ────────────────────────────────────────

  test('should log an entry', () => {
    const entry = logger.log({
      toolName: 'github_create_repo',
      args: { name: 'test-repo' },
      result: { success: true, data: { name: 'test-repo' } },
      riskLevel: 'confirm',
      approved: true,
    });

    expect(entry.id).toBeDefined();
    expect(entry.toolName).toBe('github_create_repo');
    expect(entry.result?.success).toBe(true);
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  test('should auto-generate session ID', () => {
    const entry = logger.log({ toolName: 'test', args: {} });
    expect(entry.sessionId).toBeDefined();
    expect(entry.sessionId!.length).toBe(8);
  });

  test('should auto-generate summary', () => {
    const entry = logger.log({
      toolName: 'github_create_repo',
      args: { name: 'my-project' },
    });
    expect(entry.summary).toContain('my-project');
  });

  test('should infer category from tool name', () => {
    const githubEntry = logger.log({ toolName: 'github_push_file', args: {} });
    expect(githubEntry.category).toBe('github');

    const gitEntry = logger.log({ toolName: 'git_commit', args: {} });
    expect(gitEntry.category).toBe('git');

    const fileEntry = logger.log({ toolName: 'read_file', args: {} });
    expect(fileEntry.category).toBe('filesystem');

    const otherEntry = logger.log({ toolName: 'run_command', args: {} });
    expect(otherEntry.category).toBe('utility');
  });

  // ── logStart / finish ───────────────────────────────────

  test('logStart should track duration', async () => {
    const tracker = logger.logStart('github_push_file', { path: 'test.ts' }, 'confirm');

    // Simulate some work
    await new Promise((r) => setTimeout(r, 50));

    const entry = tracker.finish({ success: true });
    expect(entry.duration).toBeGreaterThanOrEqual(40);
    expect(entry.approved).toBe(true);
  });

  test('logStart reject should mark as not approved', () => {
    const tracker = logger.logStart('github_delete_repo', { owner: 'test', repo: 'x' });
    const entry = tracker.reject();
    expect(entry.approved).toBe(false);
    expect(entry.result?.success).toBe(false);
  });

  // ── Filtering ───────────────────────────────────────────

  test('should filter by tool name', () => {
    logger.log({ toolName: 'github_push_file', args: {} });
    logger.log({ toolName: 'github_list_repos', args: {} });
    logger.log({ toolName: 'github_push_file', args: {} });

    const filtered = logger.filter({ toolName: 'github_push_file' });
    expect(filtered).toHaveLength(2);
  });

  test('should filter by risk level', () => {
    logger.log({ toolName: 'a', args: {}, riskLevel: 'auto' });
    logger.log({ toolName: 'b', args: {}, riskLevel: 'confirm' });
    logger.log({ toolName: 'c', args: {}, riskLevel: 'confirm' });

    const filtered = logger.filter({ riskLevel: 'confirm' });
    expect(filtered).toHaveLength(2);
  });

  test('should filter by success', () => {
    logger.log({ toolName: 'a', args: {}, result: { success: true } });
    logger.log({ toolName: 'b', args: {}, result: { success: false, error: 'fail' } });
    logger.log({ toolName: 'c', args: {}, result: { success: true } });

    expect(logger.filter({ success: true })).toHaveLength(2);
    expect(logger.filter({ success: false })).toHaveLength(1);
  });

  test('should filter by search query', () => {
    logger.log({ toolName: 'github_create_repo', args: { name: 'my-awesome-project' } });
    logger.log({ toolName: 'github_push_file', args: { path: 'README.md' } });

    const filtered = logger.filter({ searchQuery: 'awesome' });
    expect(filtered).toHaveLength(1);
  });

  // ── Statistics ──────────────────────────────────────────

  test('should calculate statistics', () => {
    logger.log({ toolName: 'a', args: {}, result: { success: true }, riskLevel: 'auto', duration: 100 });
    logger.log({ toolName: 'a', args: {}, result: { success: true }, riskLevel: 'auto', duration: 200 });
    logger.log({ toolName: 'b', args: {}, result: { success: false, error: 'x' }, riskLevel: 'confirm' });
    logger.log({ toolName: 'c', args: {}, approved: false, riskLevel: 'confirm' });

    const stats = logger.getStats();
    expect(stats.totalOperations).toBe(4);
    expect(stats.successCount).toBe(2);
    expect(stats.failureCount).toBe(1);
    expect(stats.rejectedCount).toBe(1);
    expect(stats.byTool['a']).toBe(2);
    expect(stats.byRiskLevel['auto']).toBe(2);
    expect(stats.byRiskLevel['confirm']).toBe(2);
    expect(stats.averageDuration).toBe(150);
  });

  // ── Persistence ─────────────────────────────────────────

  test('should persist to localStorage', () => {
    logger.log({ toolName: 'github_push_file', args: { path: 'test.ts' } });

    const stored = store['codeforge-audit-log'];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].toolName).toBe('github_push_file');
  });

  test('should load from localStorage on init', () => {
    store['codeforge-audit-log'] = JSON.stringify([
      { id: '1', toolName: 'test_tool', args: {}, timestamp: Date.now() },
    ]);

    const newLogger = new AuditLogger();
    expect(newLogger.getAll()).toHaveLength(1);
  });

  // ── Export ──────────────────────────────────────────────

  test('should export as JSON', () => {
    logger.log({ toolName: 'github_push_file', args: { path: 'x.ts' } });
    const json = logger.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.totalEntries).toBe(1);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.stats).toBeDefined();
  });

  test('should export as CSV', () => {
    logger.log({ toolName: 'github_push_file', args: { path: 'x.ts' }, result: { success: true } });
    const csv = logger.exportCSV();
    const lines = csv.split('\n');
    expect(lines.length).toBe(2); // header + 1 row
    expect(lines[0]).toContain('Tool');
    expect(lines[1]).toContain('github_push_file');
  });

  // ── Cleanup ─────────────────────────────────────────────

  test('should clear all entries', () => {
    logger.log({ toolName: 'a', args: {} });
    logger.log({ toolName: 'b', args: {} });
    expect(logger.getAll()).toHaveLength(2);

    logger.clear();
    expect(logger.getAll()).toHaveLength(0);
  });

  test('should cleanup old entries', () => {
    // Add an old entry (31 days ago)
    const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
    store['codeforge-audit-log'] = JSON.stringify([
      { id: 'old', toolName: 'old_tool', args: {}, timestamp: oldTimestamp },
      { id: 'new', toolName: 'new_tool', args: {}, timestamp: Date.now() },
    ]);

    const freshLogger = new AuditLogger();
    // Auto-cleanup should have removed the old entry
    expect(freshLogger.getAll()).toHaveLength(1);
    expect(freshLogger.getAll()[0].toolName).toBe('new_tool');
  });

  // ── Sanitization ────────────────────────────────────────

  test('should truncate long args', () => {
    const longContent = 'x'.repeat(1000);
    const entry = logger.log({ toolName: 'test', args: { content: longContent } });
    expect((entry.args.content as string).length).toBeLessThan(600);
    expect((entry.args.content as string)).toContain('[truncated]');
  });

  // ── Subscriber ──────────────────────────────────────────

  test('should notify subscribers', () => {
    const callback = jest.fn();
    logger.subscribe(callback);

    logger.log({ toolName: 'test', args: {} });
    expect(callback).toHaveBeenCalledTimes(1);

    logger.log({ toolName: 'test2', args: {} });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('should unsubscribe', () => {
    const callback = jest.fn();
    const unsub = logger.subscribe(callback);

    logger.log({ toolName: 'test', args: {} });
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    logger.log({ toolName: 'test2', args: {} });
    expect(callback).toHaveBeenCalledTimes(1); // still 1
  });

  // ── Session Management ──────────────────────────────────

  test('should create new sessions', () => {
    const s1 = logger.getSessionId();
    const s2 = logger.newSession();
    expect(s1).not.toBe(s2);
    expect(s2.length).toBe(8);
  });
});
