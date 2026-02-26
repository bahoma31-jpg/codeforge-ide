'use client';

/**
 * CodeForge IDE — Chat Input
 * Input component with send button, keyboard shortcuts,
 * and quick action buttons.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2, Paperclip, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  isProcessing: boolean;
  isConfigured: boolean;
}

const QUICK_ACTIONS = [
  { label: 'اشرح الكود', prompt: 'اشرح لي الكود الموجود في الملف المفتوح حالياً' },
  { label: 'أصلح الخطأ', prompt: 'هناك خطأ في الكود، ساعدني في إصلاحه' },
  { label: 'بنية المشروع', prompt: 'اعرض لي بنية ملفات المشروع الحالي' },
  { label: 'أنشئ ملف', prompt: 'أنشئ ملف جديد باسم ' },
];

export function ChatInput({ onSend, isProcessing, isConfigured }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing || !isConfigured) return;

    setInput('');
    setShowQuickActions(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSend(trimmed);
  }, [input, isProcessing, isConfigured, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter to send, Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      setInput(prompt);
      setShowQuickActions(false);
      textareaRef.current?.focus();
    },
    []
  );

  return (
    <div className="border-t border-[#313244] bg-[#181825]">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              className="px-2.5 py-1 rounded-full bg-[#313244] hover:bg-[#45475a] text-[10px] text-[#cdd6f4] transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            showQuickActions
              ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
              : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
          }`}
          title="إجراءات سريعة"
        >
          <Sparkles size={16} />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isConfigured
                ? 'اكتب رسالتك... (Enter للإرسال)'
                : 'أعد إعداد مفتاح API أولاً...'
            }
            disabled={!isConfigured || isProcessing}
            rows={1}
            className="w-full px-3 py-2 rounded-xl bg-[#313244] text-[#cdd6f4] text-sm placeholder:text-[#45475a] resize-none outline-none focus:ring-1 focus:ring-[#89b4fa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
            dir="auto"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing || !isConfigured}
          className="flex-shrink-0 p-2 rounded-lg bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#89b4fa]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="إرسال (Enter)"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-3 pb-2 text-[9px] text-[#45475a] text-center">
        Enter للإرسال • Shift+Enter لسطر جديد
      </div>
    </div>
  );
}
