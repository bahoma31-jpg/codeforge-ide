'use client';

/**
 * CodeForge IDE — Notify Toast
 * Non-blocking notification for NOTIFY-level tool operations.
 * Auto-dismisses after 4 seconds with animated progress bar.
 * Stacks vertically for multiple concurrent notifications.
 */

import React, { useEffect, useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import {
  Info,
  X,
  FileCode,
  GitBranch,
  Github,
  Wrench,
} from 'lucide-react';

interface Notification {
  id: string;
  toolName: string;
  description: string;
  affectedFiles: string[];
  createdAt: number;
}

interface NotifyToastProps {
  notification: Notification;
}

const AUTO_DISMISS_MS = 4000;

function getToolIcon(toolName: string) {
  if (toolName.startsWith('github_')) return <Github size={12} className="text-[#cba6f7]" />;
  if (toolName.startsWith('git_')) return <GitBranch size={12} className="text-[#fab387]" />;
  if (toolName.startsWith('fs_')) return <FileCode size={12} className="text-[#89b4fa]" />;
  return <Wrench size={12} className="text-[#6c7086]" />;
}

function SingleToast({ notification }: NotifyToastProps) {
  const { dismissNotification } = useAgentStore();
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsExiting(true);
        setTimeout(() => dismissNotification(notification.id), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.id, dismissNotification]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#f9e2af]/30 bg-[#1e1e2e]/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      {/* Content */}
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="mt-0.5">
          <Info size={14} className="text-[#f9e2af]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {getToolIcon(notification.toolName)}
            <span className="text-[11px] font-medium text-[#cdd6f4] truncate">
              {notification.description}
            </span>
          </div>
          {notification.affectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {notification.affectedFiles.slice(0, 3).map((file) => (
                <span
                  key={file}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#313244] text-[#89b4fa] truncate max-w-[150px]"
                >
                  {file}
                </span>
              ))}
              {notification.affectedFiles.length > 3 && (
                <span className="text-[9px] text-[#6c7086]">
                  +{notification.affectedFiles.length - 3} \u0645\u0644\u0641\u0627\u062a
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => dismissNotification(notification.id), 300);
          }}
          className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
        >
          <X size={10} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-[#313244]">
        <div
          className="h-full bg-[#f9e2af]/60 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * NotifyToast Stack — renders all active NOTIFY notifications.
 * Place this inside agent-panel above the chat input.
 */
export function NotifyToastStack() {
  const { notifications } = useAgentStore();

  if (notifications.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 px-3 pb-2">
      {notifications.map((n) => (
        <SingleToast key={n.id} notification={n} />
      ))}
    </div>
  );
}
