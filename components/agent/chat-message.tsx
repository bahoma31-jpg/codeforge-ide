'use client';

/**
 * CodeForge IDE — Chat Message v2.0
 * Renders a single chat message with rich markdown support,
 * tool call indicators, and clickable file paths.
 *
 * v2.0 — Replaced naive regex-based markdown with MarkdownRenderer.
 *         Filters out raw tool JSON noise from displayed messages.
 */

import React, { useState } from 'react';
import type { AgentMessage, ToolCall } from '@/lib/agent/types';
import { MarkdownRenderer } from './markdown-renderer';
import { cleanAIContent } from '@/lib/utils/markdown-parser';
import {
  User,
  Bot,
  Wrench,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface ChatMessageProps {
  message: AgentMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  // ── Filter out internal tool messages from display ──
  if (isTool) {
    return <ToolResultMessage message={message} />;
  }

  // ── Filter out noise from assistant messages ──
  // Messages that are just "[Calling tool: ...]" should be hidden
  if (!isUser && message.content) {
    const cleaned = cleanAIContent(message.content);
    if (!cleaned || cleaned.startsWith('[Calling tool:')) {
      return null;
    }
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
            : 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Content */}
      <div
        className={`flex-1 max-w-[85%] ${
          isUser ? 'text-right' : 'text-left'
        }`}
      >
        <div
          className={`inline-block px-3 py-2 rounded-xl leading-relaxed ${
            isUser
              ? 'bg-[#89b4fa]/15 text-[#cdd6f4] rounded-tr-sm'
              : 'bg-[#313244] text-[#cdd6f4] rounded-tl-sm'
          }`}
        >
          {isUser ? (
            // User messages: plain text, no markdown
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            // Assistant messages: rich markdown rendering
            <MarkdownRenderer content={message.content} />
          )}

          {/* Tool calls indicator */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#45475a]/50">
              {message.toolCalls.map((tc) => (
                <ToolCallBadge key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-[10px] text-[#45475a] mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString('ar-DZ', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Tool call badge showing status
 */
function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  // Friendly Arabic labels for common tools
  const toolLabels: Record<string, string> = {
    fs_read_file: 'قراءة ملف',
    fs_create_file: 'إنشاء ملف',
    fs_update_file: 'تحديث ملف',
    fs_delete_file: 'حذف ملف',
    fs_list_files: 'عرض الملفات',
    fs_search_files: 'بحث في الملفات',
    fs_create_folder: 'إنشاء مجلد',
    fs_rename_file: 'إعادة تسمية',
    fs_move_file: 'نقل ملف',
    github_read_file: 'قراءة من GitHub',
    github_push_file: 'رفع ملف',
    github_push_files: 'رفع ملفات',
    github_edit_file: 'تعديل ملف',
    github_delete_file: 'حذف ملف',
    github_list_files: 'عرض ملفات GitHub',
    github_create_branch: 'إنشاء فرع',
    github_create_pull_request: 'إنشاء PR',
    github_merge_pull_request: 'دمج PR',
    github_create_issue: 'إنشاء Issue',
    github_search_code: 'بحث في الكود',
    git_status: 'حالة Git',
    git_commit: 'حفظ التغييرات',
    git_push: 'دفع للريموت',
    get_project_context: 'تحليل المشروع',
    explain_code: 'شرح الكود',
    suggest_fix: 'اقتراح إصلاح',
  };

  const toolName = toolCall.toolName || toolCall.name || 'unknown';
  const displayName = toolLabels[toolName] || toolName;

  const statusConfig = {
    pending: { icon: <Clock size={12} className="text-[#f9e2af]" />, color: 'text-[#f9e2af]' },
    approved: { icon: <CheckCircle2 size={12} className="text-[#a6e3a1]" />, color: 'text-[#a6e3a1]' },
    rejected: { icon: <XCircle size={12} className="text-[#f38ba8]" />, color: 'text-[#f38ba8]' },
    executing: { icon: <Loader2 size={12} className="animate-spin text-[#89b4fa]" />, color: 'text-[#89b4fa]' },
    completed: { icon: <CheckCircle2 size={12} className="text-[#a6e3a1]" />, color: 'text-[#a6e3a1]' },
    failed: { icon: <XCircle size={12} className="text-[#f38ba8]" />, color: 'text-[#f38ba8]' },
  };

  const status = statusConfig[toolCall.status] || statusConfig.pending;

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Wrench size={10} />
        <span>{displayName}</span>
        {status.icon}
      </button>

      {expanded && (
        <div className="mt-1 ml-4 p-2 rounded bg-[#181825] border border-[#313244] text-[10px] font-mono max-h-40 overflow-y-auto">
          <div className="text-[#6c7086] mb-0.5">المعاملات:</div>
          <pre className="text-[#cdd6f4] whitespace-pre-wrap break-all">
            {formatToolArgs(toolCall.args)}
          </pre>
          {toolCall.result && (
            <>
              <div className="text-[#6c7086] mt-1.5 mb-0.5">النتيجة:</div>
              <pre className="text-[#cdd6f4] whitespace-pre-wrap break-all">
                {formatToolResult(toolCall.result)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format tool arguments for display — hide long values
 */
function formatToolArgs(args: Record<string, unknown> | undefined): string {
  if (!args) return '{}';
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.length > 200) {
      cleaned[key] = value.slice(0, 100) + `... (${value.length} حرف)`;
    } else {
      cleaned[key] = value;
    }
  }
  return JSON.stringify(cleaned, null, 2);
}

/**
 * Format tool result — truncate long content
 */
function formatToolResult(result: unknown): string {
  const str = JSON.stringify(result, null, 2);
  if (str.length > 500) {
    return str.slice(0, 400) + '\n... (مقتطع)';
  }
  return str;
}

/**
 * Tool result message (compact inline indicator)
 */
function ToolResultMessage({ message }: { message: AgentMessage }) {
  const tc = message.toolCalls?.[0];
  if (!tc) return null;

  const success = tc.result?.success;

  return (
    <div className="flex items-center gap-2 px-3 py-1 mx-8">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          success ? 'bg-[#a6e3a1]' : 'bg-[#f38ba8]'
        }`}
      />
      <span className="text-[10px] text-[#45475a]">
        {success ? '✓' : '✗'}
      </span>
    </div>
  );
}
