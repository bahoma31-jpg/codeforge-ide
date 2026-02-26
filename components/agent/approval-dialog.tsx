'use client';

/**
 * CodeForge IDE — Approval Dialog v2.0
 * Inline dialog for confirming dangerous agent operations.
 * Shows risk level badge, affected files, diff preview,
 * pending timer, and keyboard shortcuts (Enter/Escape).
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { PendingApproval } from '@/lib/agent/types';
import { useAgentStore } from '@/lib/stores/agent-store';
import {
  ShieldAlert,
  Check,
  X,
  FileWarning,
  GitBranch,
  Github,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ApprovalDialogProps {
  approval: PendingApproval;
}

export function ApprovalDialog({ approval }: ApprovalDialogProps) {
  const { approveAction, rejectAction } = useAgentStore();
  const [elapsed, setElapsed] = useState(0);

  // Pending timer
  useEffect(() => {
    if (approval.status !== 'pending') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - approval.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [approval.createdAt, approval.status]);

  // Keyboard shortcuts: Enter = approve, Escape = reject
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (approval.status !== 'pending') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        approveAction(approval.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        rejectAction(approval.id);
      }
    },
    [approval.id, approval.status, approveAction, rejectAction]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (approval.status !== 'pending') return null;

  const toolName = approval.toolCall.name || approval.toolCall.toolName || 'unknown';
  const isGitOp = toolName.startsWith('git_');
  const isGitHubOp = toolName.startsWith('github_');

  // Format elapsed time
  const formatTime = (s: number) => {
    if (s < 60) return `${s}ث`;
    return `${Math.floor(s / 60)}د ${s % 60}ث`;
  };

  return (
    <div className="mx-3 mb-3 rounded-xl border border-[#f38ba8]/40 bg-[#f38ba8]/5 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f38ba8]/10 border-b border-[#f38ba8]/20">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[#f38ba8]" />
          <span className="text-xs font-semibold text-[#f38ba8]">
            🔴 عملية حساسة — تحتاج تأكيدك
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#6c7086]">
          <Clock size={10} />
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {/* Operation info */}
        <div className="flex items-center gap-2 text-xs text-[#cdd6f4]">
          {isGitHubOp ? (
            <Github size={12} className="text-[#cba6f7]" />
          ) : isGitOp ? (
            <GitBranch size={12} className="text-[#fab387]" />
          ) : (
            <FileWarning size={12} className="text-[#fab387]" />
          )}
          <span className="font-mono">{toolName}</span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-[#a6adc8] mt-1.5">
          {approval.description}
        </p>

        {/* Warning for destructive ops */}
        {(toolName.includes('delete') || toolName.includes('merge')) && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#f38ba8] bg-[#f38ba8]/5 rounded px-2 py-1">
            <AlertTriangle size={10} />
            <span>هذه العملية قد لا يمكن التراجع عنها</span>
          </div>
        )}

        {/* Tool arguments preview */}
        {approval.toolCall.arguments && Object.keys(approval.toolCall.arguments).length > 0 && (
          <div className="mt-2 rounded-lg bg-[#181825] border border-[#313244] p-2">
            <div className="text-[10px] text-[#45475a] mb-1">المعطيات:</div>
            {Object.entries(approval.toolCall.arguments).map(([key, value]) => (
              <div key={key} className="text-[10px] font-mono text-[#cdd6f4] mt-0.5">
                <span className="text-[#89b4fa]">{key}</span>
                <span className="text-[#45475a]">: </span>
                <span className="text-[#a6e3a1]">
                  {typeof value === 'string'
                    ? value.length > 80
                      ? value.slice(0, 80) + '...'
                      : value
                    : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Affected files */}
        {approval.affectedFiles && approval.affectedFiles.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] text-[#45475a] mb-1">الملفات المتأثرة:</div>
            {approval.affectedFiles.map((file) => (
              <div
                key={file}
                className="text-[10px] font-mono text-[#f9e2af] bg-[#313244] px-2 py-0.5 rounded mt-0.5 inline-block mr-1"
              >
                {file}
              </div>
            ))}
          </div>
        )}

        {/* Diff preview */}
        {approval.diff && (
          <div className="mt-2 rounded-lg overflow-hidden border border-[#313244]">
            <div className="px-2 py-1 bg-[#181825] text-[10px] text-[#45475a] flex items-center justify-between">
              <span>{approval.diff.filePath}</span>
              <span className="text-[#f9e2af]">{approval.diff.type}</span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {approval.diff.type === 'delete' && approval.diff.oldContent && (
                <pre className="p-2 text-[10px] font-mono text-[#f38ba8] bg-[#f38ba8]/5">
                  {approval.diff.oldContent.slice(0, 500)}
                </pre>
              )}
              {approval.diff.type === 'create' && approval.diff.newContent && (
                <pre className="p-2 text-[10px] font-mono text-[#a6e3a1] bg-[#a6e3a1]/5">
                  {approval.diff.newContent.slice(0, 500)}
                </pre>
              )}
              {approval.diff.type === 'modify' && (
                <div>
                  <pre className="p-2 text-[10px] font-mono text-[#f38ba8] bg-[#f38ba8]/5 border-b border-[#313244]">
                    - {(approval.diff.oldContent || '').slice(0, 250)}
                  </pre>
                  <pre className="p-2 text-[10px] font-mono text-[#a6e3a1] bg-[#a6e3a1]/5">
                    + {(approval.diff.newContent || '').slice(0, 250)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#f38ba8]/20 bg-[#f38ba8]/5">
        <button
          onClick={() => approveAction(approval.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a6e3a1]/20 hover:bg-[#a6e3a1]/30 text-[#a6e3a1] text-xs font-medium transition-colors"
        >
          <Check size={12} />
          تأكيد
          <span className="text-[9px] opacity-60 mr-1">(Enter)</span>
        </button>
        <button
          onClick={() => rejectAction(approval.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f38ba8]/20 hover:bg-[#f38ba8]/30 text-[#f38ba8] text-xs font-medium transition-colors"
        >
          <X size={12} />
          رفض
          <span className="text-[9px] opacity-60 mr-1">(Esc)</span>
        </button>
      </div>
    </div>
  );
}
