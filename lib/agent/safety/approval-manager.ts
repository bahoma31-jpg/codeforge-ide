/**
 * CodeForge IDE — Approval Manager v2.1
 * Manages the approval & notification flow for tool calls.
 *
 * v2.1 — Added resolveOwnerRepo() fallback for when LLM omits owner/repo.
 *         Reads from localStorage config to auto-fill missing values.
 * v2.0 — Rewritten to support all 45 tools (fs_*, git_*, github_*, utility).
 *         Added createNotification() for NOTIFY-level ops.
 *         Added formatToolSummary() for UI display.
 *         Tracks approvedBy: 'auto' | 'user' | 'notify'.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ToolCall,
  ToolDefinition,
  PendingApproval,
  AuditLogEntry,
  RiskLevel,
} from '../types';
import { classifyRisk, classifyGitHubRisk, getRiskEmoji } from './risk-classifier';

// ─── Types ────────────────────────────────────────────────────

export interface ToolNotification {
  id: string;
  toolCall: ToolCall;
  toolName: string;
  description: string;
  riskLevel: 'notify';
  affectedFiles: string[];
  createdAt: number;
}

// ─── Approval Manager ────────────────────────────────────────

export class ApprovalManager {
  private auditLog: AuditLogEntry[] = [];

  /**
   * Determine the effective risk level for a tool call.
   * Uses GitHub-specific classification for github_* tools.
   */
  getEffectiveRisk(toolCall: ToolCall, toolDef?: ToolDefinition): RiskLevel {
    if (toolCall.name.startsWith('github_')) {
      return classifyGitHubRisk(toolCall, toolDef);
    }
    return classifyRisk(toolCall, toolDef);
  }

  /**
   * Determine if a tool call needs explicit user approval (CONFIRM level)
   */
  needsApproval(toolCall: ToolCall, toolDef?: ToolDefinition): boolean {
    return this.getEffectiveRisk(toolCall, toolDef) === 'confirm';
  }

  /**
   * Determine if a tool call should show a notification (NOTIFY level)
   */
  needsNotification(toolCall: ToolCall, toolDef?: ToolDefinition): boolean {
    return this.getEffectiveRisk(toolCall, toolDef) === 'notify';
  }

  /**
   * Determine if a tool call can execute silently (AUTO level)
   */
  isAutoExecute(toolCall: ToolCall, toolDef?: ToolDefinition): boolean {
    return this.getEffectiveRisk(toolCall, toolDef) === 'auto';
  }

  /**
   * Create a pending approval request (for CONFIRM tools)
   */
  createApproval(toolCall: ToolCall, toolDef?: ToolDefinition): PendingApproval {
    const risk = this.getEffectiveRisk(toolCall, toolDef);
    // Ensure owner/repo are resolved before building description
    const resolvedToolCall = this.resolveToolCallArgs(toolCall);
    return {
      id: uuidv4(),
      toolCall: resolvedToolCall,
      toolName: toolCall.name,
      description: this.generateDescription(resolvedToolCall),
      riskLevel: risk,
      affectedFiles: this.extractAffectedFiles(resolvedToolCall),
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  /**
   * Create a notification object (for NOTIFY tools)
   */
  createNotification(toolCall: ToolCall): ToolNotification {
    const resolvedToolCall = this.resolveToolCallArgs(toolCall);
    return {
      id: uuidv4(),
      toolCall: resolvedToolCall,
      toolName: toolCall.name,
      description: this.generateDescription(resolvedToolCall),
      riskLevel: 'notify',
      affectedFiles: this.extractAffectedFiles(resolvedToolCall),
      createdAt: Date.now(),
    };
  }

  /**
   * Log an approval decision
   */
  logDecision(
    toolCall: ToolCall,
    approved: boolean,
    riskLevel: RiskLevel,
    approvedBy: 'auto' | 'user' | 'notify' = 'auto'
  ): void {
    this.auditLog.push({
      id: uuidv4(),
      toolName: toolCall.name,
      args: toolCall.arguments,
      riskLevel,
      approved,
      approvedBy,
      timestamp: Date.now(),
    });
  }

  /**
   * Get the full audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Format a tool call for clean UI display
   */
  formatToolSummary(toolCall: ToolCall, toolDef?: ToolDefinition): string {
    const risk = this.getEffectiveRisk(toolCall, toolDef);
    const emoji = getRiskEmoji(risk);
    const resolvedToolCall = this.resolveToolCallArgs(toolCall);
    const desc = this.generateDescription(resolvedToolCall);
    const files = this.extractAffectedFiles(resolvedToolCall);
    const fileStr = files.length > 0 ? `\n📁 ${files.join(', ')}` : '';
    return `${emoji} ${desc}${fileStr}`;
  }

  // ─── Private Helpers ──────────────────────────────────────

  /**
   * Resolve missing owner/repo in tool call arguments.
   * When the LLM omits owner or repo (or sends empty/unknown values),
   * this fills them from the stored agent config or auth store.
   *
   * Returns a new ToolCall with resolved arguments (does NOT mutate original).
   */
  private resolveToolCallArgs(toolCall: ToolCall): ToolCall {
    // Only resolve for github_* tools that need owner/repo
    if (!toolCall.name.startsWith('github_')) return toolCall;

    const args = { ...toolCall.arguments };
    const currentOwner = (args.owner as string) || '';
    const currentRepo = (args.repo as string) || '';

    // Check if owner/repo need resolution
    const ownerMissing = !currentOwner || currentOwner === 'unknown' || currentOwner === '?';
    const repoMissing = !currentRepo || currentRepo === 'unknown' || currentRepo === '?';

    if (!ownerMissing && !repoMissing) return toolCall;

    // Try to resolve from stored config
    const { owner: configOwner, repo: configRepo } = this.getStoredOwnerRepo();

    if (ownerMissing && configOwner) {
      args.owner = configOwner;
    }
    if (repoMissing && configRepo) {
      args.repo = configRepo;
    }

    return { ...toolCall, arguments: args };
  }

  /**
   * Read owner/repo from multiple sources (priority order):
   * 1. codeforge-agent-config in localStorage (has repoUrl)
   * 2. codeforge-project-context in localStorage
   * 3. GitHub user info cached in localStorage
   */
  private getStoredOwnerRepo(): { owner: string; repo: string } {
    let owner = '';
    let repo = '';

    try {
      // Source 1: Agent config (may have repoUrl like "https://github.com/user/repo")
      const configRaw = localStorage.getItem('codeforge-agent-config');
      if (configRaw) {
        const config = JSON.parse(configRaw);
        if (config.repoUrl) {
          const parts = config.repoUrl.replace(/\.git$/, '').split('/');
          const idx = parts.indexOf('github.com');
          if (idx !== -1 && parts[idx + 1] && parts[idx + 2]) {
            owner = parts[idx + 1];
            repo = parts[idx + 2];
          }
        }
        // Direct owner/repo fields
        if (!owner && config.owner) owner = config.owner;
        if (!repo && config.repo) repo = config.repo;
      }
    } catch { /* ignore parse errors */ }

    try {
      // Source 2: Project context
      const ctxRaw = localStorage.getItem('codeforge-project-context');
      if (ctxRaw) {
        const ctx = JSON.parse(ctxRaw);
        if (!owner && ctx.owner) owner = ctx.owner;
        if (!repo && ctx.repo) repo = ctx.repo;
        if (ctx.repoUrl && (!owner || !repo)) {
          const parts = ctx.repoUrl.replace(/\.git$/, '').split('/');
          const idx = parts.indexOf('github.com');
          if (idx !== -1) {
            if (!owner && parts[idx + 1]) owner = parts[idx + 1];
            if (!repo && parts[idx + 2]) repo = parts[idx + 2];
          }
        }
      }
    } catch { /* ignore parse errors */ }

    try {
      // Source 3: GitHub user info (owner only)
      const userRaw = localStorage.getItem('codeforge-github-user');
      if (userRaw && !owner) {
        const user = JSON.parse(userRaw);
        if (user.login) owner = user.login;
      }
    } catch { /* ignore parse errors */ }

    return { owner, repo };
  }

  /**
   * Extract affected file paths from tool arguments
   */
  private extractAffectedFiles(toolCall: ToolCall): string[] {
    const args = toolCall.arguments;
    const files: string[] = [];

    // Single file path
    const singlePath = (args.filePath as string) || (args.path as string) || '';
    if (singlePath) files.push(singlePath);

    // Node ID (for fs_* tools — we can't resolve to path here, so we note the ID)
    const nodeId = args.nodeId as string;
    if (nodeId && files.length === 0) files.push(`[id:${nodeId}]`);

    // Multiple files (github_push_files)
    const multiFiles = args.files as Array<{ path: string }> | undefined;
    if (multiFiles && Array.isArray(multiFiles)) {
      for (const f of multiFiles) {
        if (f.path) files.push(f.path);
      }
    }

    // Git stage paths
    const paths = args.paths as string[] | undefined;
    if (paths && Array.isArray(paths)) {
      files.push(...paths);
    }

    return files;
  }

  /**
   * Generate a human-readable description for any tool call.
   * Covers all 45 tools across 4 categories.
   */
  private generateDescription(toolCall: ToolCall): string {
    const args = toolCall.arguments;
    const path = (args.path as string) || (args.filePath as string) || '';
    const owner = (args.owner as string) || '';
    const repo = (args.repo as string) || '';
    const repoStr = owner && repo ? `${owner}/${repo}` : repo || '';
    const branch = (args.branch as string) || '';

    switch (toolCall.name) {
      // ── FS Tools ──
      case 'fs_list_files':
        return 'عرض ملفات المشروع المحلي';
      case 'fs_read_file':
        return `قراءة ملف: ${path || (args.fileId as string) || '?'}`;
      case 'fs_search_files':
        return `بحث عن: "${(args.query as string) || '?'}"`;
      case 'fs_create_file':
        return `إنشاء ملف: ${(args.name as string) || '?'}`;
      case 'fs_update_file':
        return `تحديث ملف: ${path || (args.fileId as string) || '?'}`;
      case 'fs_create_folder':
        return `إنشاء مجلد: ${(args.name as string) || '?'}`;
      case 'fs_delete_file':
        return `⚠️ حذف: ${(args.nodeId as string) || '?'}`;
      case 'fs_rename_file':
        return `إعادة تسمية إلى: ${(args.newName as string) || '?'}`;
      case 'fs_move_file':
        return `نقل ملف: ${(args.nodeId as string) || '?'}`;

      // ── Git Tools ──
      case 'git_status':
        return 'عرض حالة Git';
      case 'git_diff':
        return path ? `عرض التغييرات: ${path}` : 'عرض جميع التغييرات';
      case 'git_log':
        return `عرض سجل الحفظ (آخر ${(args.maxCount as number) || 10})`;
      case 'git_stage':
        return `تجهيز ملفات للحفظ: ${((args.paths as string[]) || []).join(', ') || '.'}`;
      case 'git_commit':
        return `حفظ: "${(args.message as string) || '?'}"`;
      case 'git_push':
        return `⚠️ دفع التغييرات${branch ? ` (فرع: ${branch})` : ''}`;
      case 'git_create_branch':
        return `إنشاء فرع: ${(args.name as string) || '?'}`;
      case 'git_create_pr':
        return `⚠️ إنشاء PR: "${(args.title as string) || '?'}"`;

      // ── GitHub: Repo Tools ──
      case 'github_create_repo':
        return `⚠️ إنشاء مستودع: ${(args.name as string) || '?'}`;
      case 'github_delete_repo':
        return `🚨 حذف مستودع نهائياً: ${repoStr || '?'}`;
      case 'github_list_repos':
        return 'عرض المستودعات';
      case 'github_get_repo_info':
        return `معلومات: ${repoStr}`;
      case 'github_search_repos':
        return `بحث عن مستودعات: "${(args.query as string) || '?'}"`;

      // ── GitHub: File Tools ──
      case 'github_push_file':
        return `رفع ملف: ${path} → ${repoStr}`;
      case 'github_push_files': {
        const count = ((args.files as unknown[]) || []).length;
        return `⚠️ رفع ${count} ملف(ات) → ${repoStr}`;
      }
      case 'github_read_file':
        return `قراءة: ${path} من ${repoStr}`;
      case 'github_edit_file':
        return `تعديل: ${path} في ${repoStr}`;
      case 'github_delete_file':
        return `⚠️ حذف ملف: ${path} من ${repoStr}`;
      case 'github_list_files':
        return `عرض ملفات: ${path || '/'} في ${repoStr}`;

      // ── GitHub: Branch Tools ──
      case 'github_create_branch':
        return `إنشاء فرع: ${branch} في ${repoStr}`;
      case 'github_list_branches':
        return `عرض فروع: ${repoStr}`;
      case 'github_delete_branch':
        return `⚠️ حذف فرع: ${branch} من ${repoStr}`;

      // ── GitHub: PR Tools ──
      case 'github_create_pull_request':
        return `إنشاء PR: "${(args.title as string) || '?'}" في ${repoStr}`;
      case 'github_list_pull_requests':
        return `عرض PRs: ${repoStr}`;
      case 'github_get_pull_request':
        return `تفاصيل PR #${(args.pullNumber as number) || '?'}`;
      case 'github_merge_pull_request':
        return `⚠️ دمج PR #${(args.pullNumber as number) || '?'} في ${repoStr}`;

      // ── GitHub: Issue Tools ──
      case 'github_create_issue':
        return `إنشاء Issue: "${(args.title as string) || '?'}" في ${repoStr}`;
      case 'github_list_issues':
        return `عرض Issues: ${repoStr}`;
      case 'github_update_issue':
        return `تحديث Issue #${(args.issueNumber as number) || '?'}`;
      case 'github_add_comment':
        return `تعليق على #${(args.issueNumber as number) || '?'} في ${repoStr}`;

      // ── GitHub: Search & History ──
      case 'github_search_code':
        return `بحث في الكود: "${(args.query as string) || '?'}" — ${repoStr}`;
      case 'github_get_commit_history':
        return `سجل الحفظ: ${repoStr}${branch ? ` (${branch})` : ''}`;
      case 'github_get_user_info':
        return 'معلومات المستخدم';

      // ── Utility Tools ──
      case 'get_project_context':
        return 'تحليل سياق المشروع';
      case 'explain_code':
        return 'شرح الكود';
      case 'suggest_fix':
        return 'اقتراح إصلاح';

      default:
        return `تنفيذ: ${toolCall.name}`;
    }
  }
}
