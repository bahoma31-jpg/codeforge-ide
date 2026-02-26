'use client';

/**
 * CodeForge IDE — Chat Message
 * Renders a single chat message with markdown support,
 * tool call indicators, and diff previews.
 */

import React, { useState } from 'react';
import type { AgentMessage, ToolCall } from '@/lib/agent/types';
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
  const isAssistant = message.role === 'assistant';

  if (isTool) {
    return <ToolResultMessage message={message} />;
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
          className={`inline-block px-3 py-2 rounded-xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[#89b4fa]/15 text-[#cdd6f4] rounded-tr-sm'
              : 'bg-[#313244] text-[#cdd6f4] rounded-tl-sm'
          }`}
        >
          {/* Message content with basic markdown */}
          <div className="whitespace-pre-wrap break-words agent-message-content">
            <MessageContent content={message.content} />
          </div>

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
 * Render message content with basic markdown formatting
 */
function MessageContent({ content }: { content: string }) {
  if (!content) return null;

  // Basic markdown: bold, code blocks, inline code
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/);

  return (
    <>
      {parts.map((part, i) => {
        // Code block
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3);
          const firstLine = code.indexOf('\n');
          const lang = firstLine > 0 ? code.slice(0, firstLine).trim() : '';
          const codeContent = firstLine > 0 ? code.slice(firstLine + 1) : code;

          return (
            <pre
              key={i}
              className="my-2 p-2.5 rounded-lg bg-[#181825] border border-[#313244] overflow-x-auto text-xs font-mono"
            >
              {lang && (
                <div className="text-[10px] text-[#45475a] mb-1.5 font-sans">
                  {lang}
                </div>
              )}
              <code className="text-[#cdd6f4]">{codeContent}</code>
            </pre>
          );
        }

        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-[#181825] text-[#f9e2af] text-xs font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-[#cdd6f4]">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * Tool call badge showing status
 */
function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: <Clock size={12} className="text-[#f9e2af]" />,
    approved: <CheckCircle2 size={12} className="text-[#a6e3a1]" />,
    rejected: <XCircle size={12} className="text-[#f38ba8]" />,
    executing: <Loader2 size={12} className="animate-spin text-[#89b4fa]" />,
    completed: <CheckCircle2 size={12} className="text-[#a6e3a1]" />,
    failed: <XCircle size={12} className="text-[#f38ba8]" />,
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Wrench size={10} />
        <span className="font-mono">{toolCall.toolName}</span>
        {statusIcon[toolCall.status]}
      </button>

      {expanded && (
        <div className="mt-1 ml-4 p-2 rounded bg-[#181825] border border-[#313244] text-[10px] font-mono">
          <div className="text-[#6c7086]">المعاملات:</div>
          <pre className="text-[#cdd6f4] whitespace-pre-wrap">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
          {toolCall.result && (
            <>
              <div className="text-[#6c7086] mt-1">النتيجة:</div>
              <pre className="text-[#cdd6f4] whitespace-pre-wrap">
                {JSON.stringify(toolCall.result, null, 2).slice(0, 300)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tool result message (compact)
 */
function ToolResultMessage({ message }: { message: AgentMessage }) {
  const tc = message.toolCalls?.[0];
  if (!tc) return null;

  const success = tc.result?.success;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mx-8">
      <div
        className={`w-1 h-1 rounded-full ${
          success ? 'bg-[#a6e3a1]' : 'bg-[#f38ba8]'
        }`}
      />
      <span className="text-[10px] font-mono text-[#45475a]">
        {tc.toolName}
        {success ? ' ✓' : ' ✗'}
      </span>
    </div>
  );
}
