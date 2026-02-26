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
  fs_list_files: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u0645\u0644\u0641\u0627\u062a...',
  fs_read_file: '\u062c\u0627\u0631\u064a \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641...',
  fs_search_files: '\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b...',
  fs_create_file: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641...',
  fs_update_file: '\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0644\u0641...',
  fs_create_folder: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u062c\u0644\u062f...',
  fs_delete_file: '\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0627\u0644\u0645\u0644\u0641...',
  fs_rename_file: '\u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0633\u0645\u064a\u0629...',
  fs_move_file: '\u062c\u0627\u0631\u064a \u0646\u0642\u0644 \u0627\u0644\u0645\u0644\u0641...',

  // Git
  git_status: '\u062c\u0627\u0631\u064a \u0641\u062d\u0635 \u062d\u0627\u0644\u0629 Git...',
  git_diff: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a...',
  git_log: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u0633\u062c\u0644...',
  git_stage: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062c\u0647\u064a\u0632 \u0644\u0644\u062d\u0641\u0638...',
  git_commit: '\u062c\u0627\u0631\u064a \u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a...',
  git_push: '\u062c\u0627\u0631\u064a \u0627\u0644\u062f\u0641\u0639 \u0644\u0640 GitHub...',
  git_create_branch: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0641\u0631\u0639...',
  git_create_pr: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 PR...',

  // GitHub: Repo
  github_create_repo: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u062a\u0648\u062f\u0639...',
  github_delete_repo: '\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639...',
  github_list_repos: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639\u0627\u062a...',
  github_get_repo_info: '\u062c\u0627\u0631\u064a \u062c\u0644\u0628 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639...',
  github_search_repos: '\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0645\u0633\u062a\u0648\u062f\u0639\u0627\u062a...',
  github_get_user_info: '\u062c\u0627\u0631\u064a \u062c\u0644\u0628 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645...',

  // GitHub: Files
  github_push_file: '\u062c\u0627\u0631\u064a \u0631\u0641\u0639 \u0645\u0644\u0641...',
  github_push_files: '\u062c\u0627\u0631\u064a \u0631\u0641\u0639 \u0645\u0644\u0641\u0627\u062a...',
  github_read_file: '\u062c\u0627\u0631\u064a \u0642\u0631\u0627\u0621\u0629 \u0645\u0644\u0641 \u0645\u0646 GitHub...',
  github_edit_file: '\u062c\u0627\u0631\u064a \u062a\u0639\u062f\u064a\u0644 \u0645\u0644\u0641...',
  github_delete_file: '\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0645\u0644\u0641 \u0645\u0646 GitHub...',
  github_list_files: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0645\u0644\u0641\u0627\u062a GitHub...',

  // GitHub: Branches
  github_create_branch: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0641\u0631\u0639...',
  github_list_branches: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u0641\u0631\u0648\u0639...',
  github_delete_branch: '\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0641\u0631\u0639...',

  // GitHub: PRs
  github_create_pull_request: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 PR...',
  github_list_pull_requests: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 PRs...',
  github_get_pull_request: '\u062c\u0627\u0631\u064a \u062c\u0644\u0628 \u062a\u0641\u0627\u0635\u064a\u0644 PR...',
  github_merge_pull_request: '\u062c\u0627\u0631\u064a \u062f\u0645\u062c PR...',

  // GitHub: Issues
  github_create_issue: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 Issue...',
  github_list_issues: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 Issues...',
  github_update_issue: '\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062b Issue...',
  github_add_comment: '\u062c\u0627\u0631\u064a \u0625\u0636\u0627\u0641\u0629 \u062a\u0639\u0644\u064a\u0642...',

  // GitHub: Search & History
  github_search_code: '\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0643\u0648\u062f...',
  github_get_commit_history: '\u062c\u0627\u0631\u064a \u062c\u0644\u0628 \u0633\u062c\u0644 \u0627\u0644\u062d\u0641\u0638...',

  // Utility
  get_project_context: '\u062c\u0627\u0631\u064a \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639...',
  explain_code: '\u062c\u0627\u0631\u064a \u0634\u0631\u062d \u0627\u0644\u0643\u0648\u062f...',
  suggest_fix: '\u062c\u0627\u0631\u064a \u0627\u0642\u062a\u0631\u0627\u062d \u0625\u0635\u0644\u0627\u062d...',
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
    return { emoji: '\ud83d\udd34', color: 'text-[#f38ba8] bg-[#f38ba8]/10 border-[#f38ba8]/30' };
  }

  // NOTIFY (yellow)
  const notifyTools = [
    'fs_create_file', 'fs_update_file', 'fs_create_folder', 'fs_rename_file', 'fs_move_file',
    'git_stage', 'git_commit', 'git_create_branch',
    'github_push_file', 'github_edit_file', 'github_create_branch',
    'github_create_pull_request', 'github_create_issue', 'github_update_issue', 'github_add_comment',
  ];
  if (notifyTools.includes(toolName)) {
    return { emoji: '\ud83d\udfe1', color: 'text-[#f9e2af] bg-[#f9e2af]/10 border-[#f9e2af]/30' };
  }

  // AUTO (green) — read-only, no badge needed in most cases
  return null;
}

// ─── Component ────────────────────────────────────────────────

export function ToolCallStatus({ toolCall }: ToolCallStatusProps) {
  const toolName = toolCall.name || toolCall.toolName || 'unknown';
  const icon = TOOL_ICONS[toolName] || <Wrench size={12} />;
  const label = TOOL_LABELS[toolName] || `\u062c\u0627\u0631\u064a \u062a\u0646\u0641\u064a\u0630 ${toolName}...`;
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
