'use client';

/**
 * CodeForge IDE — Tool Call Status v2.0
 * Live indicator showing the current tool being executed.
 * Now covers ALL 45 tools (fs_*, git_*, github_*, utility).
 * Shows risk level badge during execution.
 */

import React from 'react';
import type { ToolCall } from '@/lib/agent/types';
import {
  Loader2,
  FileCode,
  FolderOpen,
  Search,
  FilePlus,
  FileEdit,
  FolderPlus,
  FileX,
  ArrowRightLeft,
  Move,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Upload,
  Github,
  Eye,
  ListTree,
  Code,
  MessageSquare,
  Tag,
  Trash2,
  PlusCircle,
  Database,
  User,
  Lightbulb,
  Wrench,
  BookOpen,
  Bug,
} from 'lucide-react';

interface ToolCallStatusProps {
  toolCall: ToolCall;
}

// ─── Icon Map (by tool name) ─────────────────────────────────

const TOOL_ICONS: Record<string, React.ReactNode> = {
  // FS Tools
  fs_list_files: <FolderOpen size={12} />,
  fs_read_file: <FileCode size={12} />,
  fs_search_files: <Search size={12} />,
  fs_create_file: <FilePlus size={12} />,
  fs_update_file: <FileEdit size={12} />,
  fs_create_folder: <FolderPlus size={12} />,
  fs_delete_file: <FileX size={12} />,
  fs_rename_file: <ArrowRightLeft size={12} />,
  fs_move_file: <Move size={12} />,

  // Git Tools
  git_status: <GitBranch size={12} />,
  git_diff: <Code size={12} />,
  git_log: <ListTree size={12} />,
  git_stage: <Upload size={12} />,
  git_commit: <GitCommit size={12} />,
  git_push: <Upload size={12} />,
  git_create_branch: <GitBranch size={12} />,
  git_create_pr: <GitPullRequest size={12} />,

  // GitHub: Repo
  github_create_repo: <PlusCircle size={12} />,
  github_delete_repo: <Trash2 size={12} />,
  github_list_repos: <Database size={12} />,
  github_get_repo_info: <Eye size={12} />,
  github_search_repos: <Search size={12} />,
  github_get_user_info: <User size={12} />,

  // GitHub: Files
  github_push_file: <Upload size={12} />,
  github_push_files: <Upload size={12} />,
  github_read_file: <FileCode size={12} />,
  github_edit_file: <FileEdit size={12} />,
  github_delete_file: <FileX size={12} />,
  github_list_files: <FolderOpen size={12} />,

  // GitHub: Branches
  github_create_branch: <GitBranch size={12} />,
  github_list_branches: <ListTree size={12} />,
  github_delete_branch: <Trash2 size={12} />,

  // GitHub: PRs
  github_create_pull_request: <GitPullRequest size={12} />,
  github_list_pull_requests: <ListTree size={12} />,
  github_get_pull_request: <Eye size={12} />,
  github_merge_pull_request: <GitMerge size={12} />,

  // GitHub: Issues
  github_create_issue: <Tag size={12} />,
  github_list_issues: <ListTree size={12} />,
  github_update_issue: <FileEdit size={12} />,
  github_add_comment: <MessageSquare size={12} />,

  // GitHub: Search & History
  github_search_code: <Search size={12} />,
  github_get_commit_history: <GitCommit size={12} />,

  // Utility
  get_project_context: <Lightbulb size={12} />,
  explain_code: <BookOpen size={12} />,
  suggest_fix: <Bug size={12} />,
};

// ─── Label Map (Arabic) ──────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  // FS
  fs_list_files: 'جاري عرض الملفات...',
  fs_read_file: 'جاري قراءة الملف...',
  fs_search_files: 'جاري البحث...',
  fs_create_file: 'جاري إنشاء ملف...',
  fs_update_file: 'جاري تحديث الملف...',
  fs_create_folder: 'جاري إنشاء مجلد...',
  fs_delete_file: 'جاري حذف الملف...',
  fs_rename_file: 'جاري إعادة التسمية...',
  fs_move_file: 'جاري نقل الملف...',

  // Git
  git_status: 'جاري فحص حالة Git...',
  git_diff: 'جاري عرض التغييرات...',
  git_log: 'جاري عرض السجل...',
  git_stage: 'جاري التجهيز للحفظ...',
  git_commit: 'جاري حفظ التغييرات...',
  git_push: 'جاري الدفع لـ GitHub...',
  git_create_branch: 'جاري إنشاء فرع...',
  git_create_pr: 'جاري إنشاء PR...',

  // GitHub: Repo
  github_create_repo: 'جاري إنشاء مستودع...',
  github_delete_repo: 'جاري حذف المستودع...',
  github_list_repos: 'جاري عرض المستودعات...',
  github_get_repo_info: 'جاري جلب معلومات المستودع...',
  github_search_repos: 'جاري البحث عن مستودعات...',
  github_get_user_info: 'جاري جلب معلومات المستخدم...',

  // GitHub: Files
  github_push_file: 'جاري رفع ملف...',
  github_push_files: 'جاري رفع ملفات...',
  github_read_file: 'جاري قراءة ملف من GitHub...',
  github_edit_file: 'جاري تعديل ملف...',
  github_delete_file: 'جاري حذف ملف من GitHub...',
  github_list_files: 'جاري عرض ملفات GitHub...',

  // GitHub: Branches
  github_create_branch: 'جاري إنشاء فرع...',
  github_list_branches: 'جاري عرض الفروع...',
  github_delete_branch: 'جاري حذف فرع...',

  // GitHub: PRs
  github_create_pull_request: 'جاري إنشاء PR...',
  github_list_pull_requests: 'جاري عرض PRs...',
  github_get_pull_request: 'جاري جلب تفاصيل PR...',
  github_merge_pull_request: 'جاري دمج PR...',

  // GitHub: Issues
  github_create_issue: 'جاري إنشاء Issue...',
  github_list_issues: 'جاري عرض Issues...',
  github_update_issue: 'جاري تحديث Issue...',
  github_add_comment: 'جاري إضافة تعليق...',

  // GitHub: Search & History
  github_search_code: 'جاري البحث في الكود...',
  github_get_commit_history: 'جاري جلب سجل الحفظ...',

  // Utility
  get_project_context: 'جاري تحليل المشروع...',
  explain_code: 'جاري شرح الكود...',
  suggest_fix: 'جاري اقتراح إصلاح...',
};

// ─── Risk Level Badge ─────────────────────────────────────────

function getRiskBadge(toolName: string): { emoji: string; color: string } | null {
  // CONFIRM (red)
  const confirmTools = [
    'fs_delete_file', 'git_push', 'git_create_pr',
    'github_delete_file', 'github_push_files', 'github_merge_pull_request',
    'github_delete_branch', 'github_create_repo', 'github_delete_repo',
  ];
  if (confirmTools.includes(toolName)) {
    return { emoji: '🔴', color: 'text-[#f38ba8] bg-[#f38ba8]/10 border-[#f38ba8]/30' };
  }

  // NOTIFY (yellow)
  const notifyTools = [
    'fs_create_file', 'fs_update_file', 'fs_create_folder', 'fs_rename_file', 'fs_move_file',
    'git_stage', 'git_commit', 'git_create_branch',
    'github_push_file', 'github_edit_file', 'github_create_branch',
    'github_create_pull_request', 'github_create_issue', 'github_update_issue', 'github_add_comment',
  ];
  if (notifyTools.includes(toolName)) {
    return { emoji: '🟡', color: 'text-[#f9e2af] bg-[#f9e2af]/10 border-[#f9e2af]/30' };
  }

  // AUTO (green) — read-only, no badge needed in most cases
  return null;
}

// ─── Component ────────────────────────────────────────────────

export function ToolCallStatus({ toolCall }: ToolCallStatusProps) {
  const toolName = toolCall.name || toolCall.toolName || 'unknown';
  const icon = TOOL_ICONS[toolName] || <Wrench size={12} />;
  const label = TOOL_LABELS[toolName] || `جاري تنفيذ ${toolName}...`;
  const riskBadge = getRiskBadge(toolName);

  // Determine category color
  let categoryColor = 'text-[#89b4fa] border-[#89b4fa]/20 bg-[#89b4fa]/5';
  if (toolName.startsWith('github_')) categoryColor = 'text-[#cba6f7] border-[#cba6f7]/20 bg-[#cba6f7]/5';
  else if (toolName.startsWith('git_')) categoryColor = 'text-[#fab387] border-[#fab387]/20 bg-[#fab387]/5';
  else if (toolName.startsWith('fs_')) categoryColor = 'text-[#89b4fa] border-[#89b4fa]/20 bg-[#89b4fa]/5';
  else categoryColor = 'text-[#a6e3a1] border-[#a6e3a1]/20 bg-[#a6e3a1]/5';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-lg border animate-pulse ${categoryColor}`}>
      <Loader2 size={14} className="animate-spin" />
      <span>{icon}</span>
      <span className="text-xs flex-1">{label}</span>
      {riskBadge && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${riskBadge.color}`}>
          {riskBadge.emoji}
        </span>
      )}
    </div>
  );
}
