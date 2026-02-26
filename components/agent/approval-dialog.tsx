'use client';

/**
 * CodeForge IDE — Approval Dialog
 * Inline dialog for confirming dangerous agent operations.
 * Shows affected files, diff preview, and approve/reject buttons.
 */

import React from 'react';
import type { PendingApproval } from '@/lib/agent/types';
import { useAgentStore } from '@/lib/stores/agent-store';
import {
  ShieldAlert,
  Check,
  X,
  FileWarning,
  GitBranch,
} from 'lucide-react';

interface ApprovalDialogProps {
  approval: PendingApproval;
}

export function ApprovalDialog({ approval }: ApprovalDialogProps) {
  const { approveAction, rejectAction } = useAgentStore();

  if (approval.status !== 'pending') return null;

  const isGitOp = approval.toolCall.toolName.startsWith('git_');

  return (
    <div className="mx-3 mb-3 rounded-xl border border-[#f9e2af]/40 bg-[#f9e2af]/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f9e2af]/10 border-b border-[#f9e2af]/20">
        <ShieldAlert size={14} className="text-[#f9e2af]" />
        <span className="text-xs font-semibold text-[#f9e2af]">
          عملية تتطلب تأكيدك
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {/* Operation info */}
        <div className="flex items-center gap-2 text-xs text-[#cdd6f4]">
          {isGitOp ? (
            <GitBranch size={12} className="text-[#fab387]" />
          ) : (
            <FileWarning size={12} className="text-[#fab387]" />
          )}
          <span className="font-mono">{approval.toolCall.toolName}</span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-[#6c7086] mt-1.5">
          {approval.description}
        </p>

        {/* Affected files */}
        {approval.affectedFiles.length > 0 && (
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
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#f9e2af]/20 bg-[#f9e2af]/5">
        <button
          onClick={() => approveAction(approval.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a6e3a1]/20 hover:bg-[#a6e3a1]/30 text-[#a6e3a1] text-xs font-medium transition-colors"
        >
          <Check size={12} />
          تأكيد
        </button>
        <button
          onClick={() => rejectAction(approval.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f38ba8]/20 hover:bg-[#f38ba8]/30 text-[#f38ba8] text-xs font-medium transition-colors"
        >
          <X size={12} />
          رفض
        </button>
      </div>
    </div>
  );
}
