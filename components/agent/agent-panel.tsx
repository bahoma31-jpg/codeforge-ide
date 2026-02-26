'use client';

/**
 * CodeForge IDE — Agent Panel v2.2
 * Main container for the AI agent interface.
 * Includes chat, approvals, audit log tabs,
 * and NOTIFY toast stack above chat input.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ToolCallStatus } from './tool-call-status';
import { ApprovalDialog } from './approval-dialog';
import { NotifyToastStack } from './notify-toast';
import {
  Bot,
  X,
  Trash2,
  MessageSquare,
  Shield,
  History,
  Loader2,
  AlertCircle,
  Bell,
} from 'lucide-react';

type TabId = 'chat' | 'approvals' | 'audit';

export function AgentPanel() {
  const {
    messages,
    isProcessing,
    isPanelOpen,
    error,
    pendingApprovals,
    notifications,
    auditLog,
    currentToolCall,
    isConfigured,
    closePanel,
    clearMessages,
    clearError,
    sendMessage,
    initialize,
  } = useAgentStore();

  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentToolCall]);

  if (!isPanelOpen) return null;

  const pendingCount = pendingApprovals.filter((a) => a.status === 'pending').length;
  const notifyCount = notifications.length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'chat',
      label: '\u0645\u062d\u0627\u062f\u062b\u0629',
      icon: <MessageSquare size={14} />,
      count: notifyCount > 0 ? notifyCount : undefined,
    },
    {
      id: 'approvals',
      label: '\u062a\u0623\u0643\u064a\u062f\u0627\u062a',
      icon: <Shield size={14} />,
      count: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'audit', label: '\u0633\u062c\u0644', icon: <History size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] border-l border-[#313244]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#313244] bg-[#181825]">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-[#89b4fa]" />
          <span className="text-sm font-semibold text-[#cdd6f4]">\u0627\u0644\u0648\u0643\u064a\u0644 \u0627\u0644\u0630\u0643\u064a</span>
          {isProcessing && (
            <Loader2 size={14} className="animate-spin text-[#89b4fa]" />
          )}
          {notifyCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#f9e2af] bg-[#f9e2af]/10 px-1.5 py-0.5 rounded-full">
              <Bell size={8} />
              {notifyCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#f38ba8] transition-colors"
            title="\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
            title="\u0625\u063a\u0644\u0627\u0642"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#313244] bg-[#181825]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#89b4fa] border-b-2 border-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#f38ba8] text-[#1e1e2e] text-[10px] flex items-center justify-center font-bold">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' && (
          <>
            {/* Not configured warning */}
            {!isConfigured && (
              <div className="mx-3 mt-3 p-3 rounded-lg bg-[#f9e2af]/10 border border-[#f9e2af]/30">
                <div className="flex items-center gap-2 text-[#f9e2af] text-xs">
                  <AlertCircle size={14} />
                  <span>\u064a\u0631\u062c\u0649 \u0625\u0639\u062f\u0627\u062f \u0645\u0641\u062a\u0627\u062d API \u0623\u0648\u0644\u0627\u064b \u0641\u064a \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</span>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mx-3 mt-3 p-3 rounded-lg bg-[#f38ba8]/10 border border-[#f38ba8]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#f38ba8] text-xs">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                  <button onClick={clearError} className="text-[#6c7086] hover:text-[#cdd6f4]">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <Bot size={40} className="text-[#45475a]" />
                  <div>
                    <p className="text-sm text-[#6c7086]">
                      \u0645\u0631\u062d\u0628\u0627\u064b! \u0623\u0646\u0627 \u0645\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0628\u0631\u0645\u062c\u064a
                    </p>
                    <p className="text-xs text-[#45475a] mt-1">
                      \u0627\u0633\u0623\u0644\u0646\u064a \u0639\u0646 \u0627\u0644\u0643\u0648\u062f \u0623\u0648 \u0627\u0637\u0644\u0628 \u0645\u0646\u064a \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Current tool execution */}
              {currentToolCall && (
                <ToolCallStatus toolCall={currentToolCall} />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pending Approvals Inline */}
            {pendingApprovals.filter((a) => a.status === 'pending').map((approval) => (
              <ApprovalDialog key={approval.id} approval={approval} />
            ))}

            {/* NOTIFY Toast Stack — above the input */}
            <NotifyToastStack />

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              isProcessing={isProcessing}
              isConfigured={isConfigured}
            />
          </>
        )}

        {activeTab === 'approvals' && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <Shield size={32} className="text-[#45475a]" />
                <p className="text-xs text-[#6c7086]">\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0623\u0643\u064a\u062f\u0627\u062a \u0645\u0639\u0644\u0642\u0629</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className={`p-3 rounded-lg border text-xs ${
                    approval.status === 'approved'
                      ? 'bg-[#a6e3a1]/10 border-[#a6e3a1]/30 text-[#a6e3a1]'
                      : approval.status === 'rejected'
                        ? 'bg-[#f38ba8]/10 border-[#f38ba8]/30 text-[#f38ba8]'
                        : 'bg-[#f9e2af]/10 border-[#f9e2af]/30 text-[#f9e2af]'
                  }`}
                >
                  <div className="font-medium">{approval.toolCall.name || approval.toolCall.toolName}</div>
                  <div className="mt-1 text-[#6c7086]">{approval.description}</div>
                  <div className="mt-1 text-[10px]">
                    {new Date(approval.createdAt).toLocaleTimeString('ar-DZ')}
                    {' \u2014 '}
                    {approval.status === 'pending' ? '\u23f3 \u0645\u0639\u0644\u0642' : approval.status === 'approved' ? '\u2705 \u0645\u0642\u0628\u0648\u0644' : '\u274c \u0645\u0631\u0641\u0648\u0636'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {auditLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <History size={32} className="text-[#45475a]" />
                <p className="text-xs text-[#6c7086]">\u0633\u062c\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0641\u0627\u0631\u063a</p>
              </div>
            ) : (
              auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 rounded bg-[#181825] border border-[#313244] text-[10px] font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className={entry.result?.success ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}>
                      {entry.result?.success ? '\u2713' : '\u2717'} {entry.toolName}
                    </span>
                    <span className="text-[#45475a]">
                      {new Date(entry.timestamp).toLocaleTimeString('ar-DZ')}
                    </span>
                  </div>
                  {entry.riskLevel && (
                    <span className={`inline-block mt-0.5 px-1 py-0 rounded text-[8px] font-medium ${
                      entry.riskLevel === 'confirm'
                        ? 'bg-[#f38ba8]/10 text-[#f38ba8]'
                        : entry.riskLevel === 'notify'
                          ? 'bg-[#f9e2af]/10 text-[#f9e2af]'
                          : 'bg-[#a6e3a1]/10 text-[#a6e3a1]'
                    }`}>
                      {entry.riskLevel === 'confirm' ? '\ud83d\udd34' : entry.riskLevel === 'notify' ? '\ud83d\udfe1' : '\ud83d\udfe2'} {entry.riskLevel}
                    </span>
                  )}
                  {entry.approvedBy && (
                    <span className="inline-block mt-0.5 mr-1 px-1 py-0 rounded text-[8px] bg-[#313244] text-[#6c7086]">
                      {entry.approvedBy}
                    </span>
                  )}
                  <div className="text-[#6c7086] mt-0.5 truncate">
                    {JSON.stringify(entry.args).slice(0, 80)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
