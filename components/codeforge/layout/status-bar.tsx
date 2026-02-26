/**
 * CodeForge IDE — Status Bar
 * Bottom bar with file info, git branch, and agent toggle.
 */

'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAgentStore } from '@/lib/stores/agent-store';
import { Bot, Settings } from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const AgentSettings = dynamic(
  () =>
    import('@/components/agent/agent-settings').then((m) => ({
      default: m.AgentSettings || m.default,
    })),
  { ssr: false }
);

export default function StatusBar() {
  const { tabs, activeTabId } = useEditorStore();
  const { theme } = useUIStore();
  const {
    isPanelOpen: isAgentOpen,
    togglePanel: toggleAgent,
    pendingApprovals,
    isProcessing,
  } = useAgentStore();
  const [showSettings, setShowSettings] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const pendingCount = pendingApprovals.filter(
    (a) => a.status === 'pending'
  ).length;

  return (
    <>
      <div className="flex h-6 items-center justify-between border-t bg-[hsl(var(--cf-statusbar))] px-3 text-xs text-muted-foreground select-none">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {activeTab && (
            <>
              <span title="الملف الحالي">
                {activeTab.fileName}
                {activeTab.isDirty && ' •'}
              </span>
              <span className="text-[10px] opacity-60" title="اللغة">
                {activeTab.language}
              </span>
              <span className="text-[10px] opacity-60" title="المسار">
                {activeTab.filePath}
              </span>
            </>
          )}
          {!activeTab && <span>لا يوجد ملف مفتوح</span>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-60">
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🔵'}
          </span>

          {/* Agent settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
            title="إعدادات الوكيل"
          >
            <Settings size={12} />
          </button>

          {/* Agent toggle button */}
          <button
            onClick={toggleAgent}
            className={`relative flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
              isAgentOpen
                ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
                : 'hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
            title={isAgentOpen ? 'إغلاق الوكيل (Ctrl+Shift+A)' : 'فتح الوكيل (Ctrl+Shift+A)'}
          >
            <Bot
              size={13}
              className={isProcessing ? 'animate-pulse' : ''}
            />
            <span className="text-[10px]">الوكيل</span>

            {/* Pending approvals badge */}
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full bg-[#f38ba8] text-[#1e1e2e] text-[8px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Agent Settings Dialog */}
      <AgentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
