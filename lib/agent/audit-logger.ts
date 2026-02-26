/**
 * CodeForge IDE — Audit Logger
 * Persistent audit logging system for all agent operations.
 * Stores entries in localStorage with auto-cleanup, filtering,
 * statistics, and export capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AuditLogEntry, ToolCallResult, RiskLevel } from './types';

const STORAGE_KEY = 'codeforge-audit-log';
const MAX_ENTRIES = 500;
const AUTO_CLEANUP_DAYS = 30;

// ─── Enhanced Audit Entry ─────────────────────────────────────

export interface AuditLogEntryEnhanced extends AuditLogEntry {
  /** Duration of tool execution in ms */
  duration?: number;
  /** Session ID for grouping operations */
  sessionId?: string;
  /** Human-readable summary */
  summary?: string;
  /** Category of the tool */
  category?: string;
  /** User who approved (or 'auto') */
  approvedBy?: 'auto' | 'user';
}

export interface AuditLogStats {
  totalOperations: number;
  successCount: number;
  failureCount: number;
  rejectedCount: number;
  byTool: Record<string, number>;
  byCategory: Record<string, number>;
  byRiskLevel: Record<string, number>;
  averageDuration: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

export interface AuditLogFilter {
  toolName?: string;
  category?: string;
  riskLevel?: RiskLevel;
  success?: boolean;
  approved?: boolean;
  dateFrom?: number;
  dateTo?: number;
  searchQuery?: string;
  sessionId?: string;
}

// ─── Audit Logger Class ───────────────────────────────────────

export class AuditLogger {
  private entries: AuditLogEntryEnhanced[] = [];
  private currentSessionId: string;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.currentSessionId = uuidv4().slice(0, 8);
    this.loadFromStorage();
    this.autoCleanup();
  }

  // ── Core Logging ────────────────────────────────────────

  /**
   * Log a tool execution with full details
   */
  log(entry: {
    toolName: string;
    args: Record<string, unknown>;
    result?: ToolCallResult;
    riskLevel?: RiskLevel;
    approved?: boolean;
    approvedBy?: 'auto' | 'user';
    duration?: number;
    category?: string;
  }): AuditLogEntryEnhanced {
    const fullEntry: AuditLogEntryEnhanced = {
      id: uuidv4(),
      toolName: entry.toolName,
      args: this.sanitizeArgs(entry.args),
      result: entry.result,
      riskLevel: entry.riskLevel || 'auto',
      approved: entry.approved ?? true,
      approvedBy: entry.approvedBy || 'auto',
      duration: entry.duration,
      sessionId: this.currentSessionId,
      category: entry.category || this.inferCategory(entry.toolName),
      summary: this.generateSummary(entry.toolName, entry.args, entry.result),
      timestamp: Date.now(),
    };

    this.entries.push(fullEntry);

    // Trim if over limit
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }

    this.saveToStorage();
    this.notifyListeners();

    return fullEntry;
  }

  /**
   * Log the start of a tool execution (returns a finish function)
   */
  logStart(toolName: string, args: Record<string, unknown>, riskLevel?: RiskLevel, category?: string): {
    finish: (result: ToolCallResult, approved?: boolean, approvedBy?: 'auto' | 'user') => AuditLogEntryEnhanced;
    reject: () => AuditLogEntryEnhanced;
  } {
    const startTime = Date.now();

    return {
      finish: (result, approved = true, approvedBy = 'auto') => {
        return this.log({
          toolName,
          args,
          result,
          riskLevel,
          approved,
          approvedBy,
          duration: Date.now() - startTime,
          category,
        });
      },
      reject: () => {
        return this.log({
          toolName,
          args,
          result: { success: false, error: 'Rejected by user' },
          riskLevel,
          approved: false,
          approvedBy: 'user',
          duration: Date.now() - startTime,
          category,
        });
      },
    };
  }

  // ── Query & Filter ──────────────────────────────────────

  /**
   * Get all entries (newest first)
   */
  getAll(): AuditLogEntryEnhanced[] {
    return [...this.entries].reverse();
  }

  /**
   * Get entries with filters
   */
  filter(filters: AuditLogFilter): AuditLogEntryEnhanced[] {
    let result = [...this.entries];

    if (filters.toolName) {
      result = result.filter((e) => e.toolName === filters.toolName);
    }
    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }
    if (filters.riskLevel) {
      result = result.filter((e) => e.riskLevel === filters.riskLevel);
    }
    if (filters.success !== undefined) {
      result = result.filter((e) => e.result?.success === filters.success);
    }
    if (filters.approved !== undefined) {
      result = result.filter((e) => e.approved === filters.approved);
    }
    if (filters.dateFrom) {
      result = result.filter((e) => e.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((e) => e.timestamp <= filters.dateTo!);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.toolName.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          JSON.stringify(e.args).toLowerCase().includes(q)
      );
    }
    if (filters.sessionId) {
      result = result.filter((e) => e.sessionId === filters.sessionId);
    }

    return result.reverse();
  }

  /**
   * Get recent entries
   */
  getRecent(count: number = 20): AuditLogEntryEnhanced[] {
    return this.entries.slice(-count).reverse();
  }

  // ── Statistics ───────────────────────────────────────────

  /**
   * Get comprehensive statistics
   */
  getStats(): AuditLogStats {
    const stats: AuditLogStats = {
      totalOperations: this.entries.length,
      successCount: 0,
      failureCount: 0,
      rejectedCount: 0,
      byTool: {},
      byCategory: {},
      byRiskLevel: {},
      averageDuration: 0,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : null,
      newestEntry: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : null,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const entry of this.entries) {
      // Success / Failure / Rejected
      if (!entry.approved) {
        stats.rejectedCount++;
      } else if (entry.result?.success) {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }

      // By tool
      stats.byTool[entry.toolName] = (stats.byTool[entry.toolName] || 0) + 1;

      // By category
      const cat = entry.category || 'unknown';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

      // By risk level
      const risk = entry.riskLevel || 'auto';
      stats.byRiskLevel[risk] = (stats.byRiskLevel[risk] || 0) + 1;

      // Duration
      if (entry.duration) {
        totalDuration += entry.duration;
        durationCount++;
      }
    }

    stats.averageDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    return stats;
  }

  // ── Export ──────────────────────────────────────────────

  /**
   * Export audit log as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalEntries: this.entries.length,
      stats: this.getStats(),
      entries: this.entries,
    }, null, 2);
  }

  /**
   * Export audit log as CSV
   */
  exportCSV(): string {
    const headers = ['ID', 'Timestamp', 'Tool', 'Category', 'Risk Level', 'Approved', 'Success', 'Duration (ms)', 'Summary', 'Error'];
    const rows = this.entries.map((e) => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.toolName,
      e.category || '',
      e.riskLevel || '',
      e.approved ? 'Yes' : 'No',
      e.result?.success ? 'Yes' : e.result ? 'No' : 'N/A',
      e.duration?.toString() || '',
      (e.summary || '').replace(/,/g, ';'),
      (e.result?.error || '').replace(/,/g, ';'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Download export as file
   */
  downloadExport(format: 'json' | 'csv'): void {
    const content = format === 'json' ? this.exportJSON() : this.exportCSV();
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const filename = `codeforge-audit-log-${new Date().toISOString().slice(0, 10)}.${format}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Management ──────────────────────────────────────────

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Delete entries older than specified days
   */
  cleanupOlderThan(days: number): number {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoff);
    const removed = before - this.entries.length;
    if (removed > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Start a new session
   */
  newSession(): string {
    this.currentSessionId = uuidv4().slice(0, 8);
    return this.currentSessionId;
  }

  // ── Private Helpers ─────────────────────────────────────

  private sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...args };
    // Truncate very long content fields
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string' && (sanitized[key] as string).length > 500) {
        sanitized[key] = (sanitized[key] as string).slice(0, 500) + '... [truncated]';
      }
    }
    return sanitized;
  }

  private inferCategory(toolName: string): string {
    if (toolName.startsWith('github_')) return 'github';
    if (toolName.startsWith('git_')) return 'git';
    if (['read_file', 'write_file', 'create_file', 'delete_file', 'list_dir', 'search_files', 'move_file', 'copy_file', 'file_info'].includes(toolName)) return 'filesystem';
    return 'utility';
  }

  private generateSummary(toolName: string, args: Record<string, unknown>, result?: ToolCallResult): string {
    const summaryMap: Record<string, () => string> = {
      github_create_repo: () => `إنشاء مستودع: ${args.name}`,
      github_delete_repo: () => `حذف مستودع: ${args.owner}/${args.repo}`,
      github_push_file: () => `دفع ملف: ${args.path} → ${args.owner}/${args.repo}`,
      github_push_files: () => `دفع ${(args.files as unknown[])?.length || '?'} ملفات → ${args.owner}/${args.repo}`,
      github_read_file: () => `قراءة ملف: ${args.path} من ${args.owner}/${args.repo}`,
      github_delete_file: () => `حذف ملف: ${args.path} من ${args.owner}/${args.repo}`,
      github_list_files: () => `عرض ملفات: ${args.path || '/'} في ${args.owner}/${args.repo}`,
      github_create_branch: () => `إنشاء فرع: ${args.branch} من ${args.fromBranch || 'main'}`,
      github_create_pull_request: () => `إنشاء PR: ${args.title}`,
      github_merge_pull_request: () => `دمج PR #${args.pullNumber} (${args.mergeMethod || 'merge'})`,
      github_create_issue: () => `إنشاء Issue: ${args.title}`,
      github_list_issues: () => `عرض Issues: ${args.owner}/${args.repo}`,
      github_add_comment: () => `تعليق على #${args.issueNumber}`,
      github_search_repos: () => `بحث: ${args.query}`,
      github_get_user_info: () => `استعلام عن معلومات المستخدم`,
      github_get_repo_info: () => `معلومات: ${args.owner}/${args.repo}`,
      github_list_repos: () => `عرض المستودعات`,
      github_list_branches: () => `عرض الفروع: ${args.owner}/${args.repo}`,
      github_list_pull_requests: () => `عرض PRs: ${args.owner}/${args.repo}`,
      read_file: () => `قراءة: ${args.path}`,
      write_file: () => `كتابة: ${args.path}`,
      create_file: () => `إنشاء: ${args.path}`,
    };

    const generator = summaryMap[toolName];
    if (generator) {
      try { return generator(); } catch { /* fall through */ }
    }

    return `${toolName}(${Object.keys(args).join(', ')})`;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
      }
    } catch {
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Storage full — remove old entries and retry
      this.entries = this.entries.slice(-Math.floor(MAX_ENTRIES / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
      } catch { /* give up */ }
    }
  }

  private autoCleanup(): void {
    this.cleanupOlderThan(AUTO_CLEANUP_DAYS);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn());
  }
}

// ─── Singleton Instance ───────────────────────────────────────

let _instance: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!_instance) {
    _instance = new AuditLogger();
  }
  return _instance;
}
