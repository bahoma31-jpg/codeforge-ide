'use client';

/**
 * CodeForge IDE — Tool Call Status
 * Live indicator showing the current tool being executed.
 */

import React from 'react';
import type { ToolCall } from '@/lib/agent/types';
import { Loader2, FileCode, GitBranch, Lightbulb, Wrench } from 'lucide-react';

interface ToolCallStatusProps {
  toolCall: ToolCall;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  list_files: <FileCode size={12} />,
  read_file: <FileCode size={12} />,
  create_file: <FileCode size={12} />,
  update_file: <FileCode size={12} />,
  delete_file: <FileCode size={12} />,
  search_files: <FileCode size={12} />,
  create_folder: <FileCode size={12} />,
  rename_file: <FileCode size={12} />,
  move_file: <FileCode size={12} />,
  git_status: <GitBranch size={12} />,
  git_diff: <GitBranch size={12} />,
  git_stage: <GitBranch size={12} />,
  git_commit: <GitBranch size={12} />,
  git_push: <GitBranch size={12} />,
  git_create_branch: <GitBranch size={12} />,
  git_create_pr: <GitBranch size={12} />,
  get_project_context: <Lightbulb size={12} />,
  explain_code: <Lightbulb size={12} />,
  suggest_fix: <Lightbulb size={12} />,
};

const TOOL_LABELS: Record<string, string> = {
  list_files: 'جاري عرض الملفات...',
  read_file: 'جاري قراءة الملف...',
  create_file: 'جاري إنشاء ملف...',
  update_file: 'جاري تحديث الملف...',
  delete_file: 'جاري حذف الملف...',
  search_files: 'جاري البحث...',
  create_folder: 'جاري إنشاء مجلد...',
  rename_file: 'جاري إعادة التسمية...',
  move_file: 'جاري نقل الملف...',
  git_status: 'جاري فحص حالة Git...',
  git_diff: 'جاري عرض التغييرات...',
  git_stage: 'جاري التجهيز للحفظ...',
  git_commit: 'جاري حفظ التغييرات...',
  git_push: 'جاري الدفع لـ GitHub...',
  git_create_branch: 'جاري إنشاء فرع...',
  git_create_pr: 'جاري إنشاء Pull Request...',
  get_project_context: 'جاري تحليل المشروع...',
  explain_code: 'جاري تحليل الكود...',
  suggest_fix: 'جاري اقتراح حل...',
};

export function ToolCallStatus({ toolCall }: ToolCallStatusProps) {
  const icon = TOOL_ICONS[toolCall.toolName] || <Wrench size={12} />;
  const label = TOOL_LABELS[toolCall.toolName] || `جاري تنفيذ ${toolCall.toolName}...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 mx-2 rounded-lg bg-[#89b4fa]/5 border border-[#89b4fa]/20 animate-pulse">
      <Loader2 size={14} className="animate-spin text-[#89b4fa]" />
      <span className="text-[#89b4fa]">{icon}</span>
      <span className="text-xs text-[#89b4fa]">{label}</span>
    </div>
  );
}
