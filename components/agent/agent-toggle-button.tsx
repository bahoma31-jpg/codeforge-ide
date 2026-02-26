'use client';

/**
 * CodeForge IDE — Agent Toggle Button
 * Floating button to open/close the agent panel.
 * Shows notification badge for pending approvals.
 */

import React, { useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AgentSettings } from './agent-settings';
import { Bot, Settings } from 'lucide-react';

export function AgentToggleButton() {
  const { isPanelOpen, togglePanel, pendingApprovals, isProcessing } = useAgentStore();
  const [showSettings, setShowSettings] = useState(false);

  const pendingCount = pendingApprovals.filter((a) => a.status === 'pending').length;

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          title="إعدادات الوكيل"
        >
          <Settings size={16} />
        </button>

        {/* Toggle button */}
        <button
          onClick={togglePanel}
          className={`relative p-2 rounded-lg transition-all ${
            isPanelOpen
              ? 'bg-[#89b4fa] text-[#1e1e2e]'
              : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
          }`}
          title={isPanelOpen ? 'إغلاق الوكيل' : 'فتح الوكيل'}
        >
          <Bot size={18} className={isProcessing ? 'animate-pulse' : ''} />

          {/* Badge */}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f38ba8] text-[#1e1e2e] text-[9px] flex items-center justify-center font-bold animate-bounce">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Settings Dialog */}
      <AgentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
