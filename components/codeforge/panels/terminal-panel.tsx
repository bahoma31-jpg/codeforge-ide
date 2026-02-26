'use client';

/**
 * CodeForge IDE — Terminal Panel (Sidebar) v1.0
 * Lightweight terminal placeholder for the sidebar.
 * Shows quick command execution and links to the full
 * terminal in the bottom panel.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  Trash2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandEntry {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  isError?: boolean;
}

export function TerminalSidePanel() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    let output = '';
    let isError = false;

    // Simple built-in commands
    switch (trimmed.toLowerCase()) {
      case 'help':
        output = [
          'الأوامر المتوفرة:',
          '  help      — عرض هذه المساعدة',
          '  clear     — مسح الشاشة',
          '  date      — التاريخ والوقت',
          '  whoami    — معلومات المستخدم',
          '  version   — إصدار CodeForge',
          '',
          '💡 للتيرمنال الكامل، استخدم اللوحة السفلية (Terminal tab)',
        ].join('\n');
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'date':
        output = new Date().toLocaleString('ar-DZ', {
          dateStyle: 'full',
          timeStyle: 'medium',
        });
        break;
      case 'whoami':
        try {
          const user = localStorage.getItem('codeforge-github-user');
          if (user) {
            const parsed = JSON.parse(user);
            output = `${parsed.login || 'unknown'} (${parsed.name || 'N/A'})`;
          } else {
            output = 'لم يتم تسجيل الدخول — أدخل GitHub Token في الإعدادات';
          }
        } catch {
          output = 'غير متوفر';
        }
        break;
      case 'version':
        output = 'CodeForge IDE v1.0.0-alpha';
        break;
      default:
        output = `الأمر غير معروف: ${trimmed}\nاكتب help لعرض الأوامر المتوفرة`;
        isError = true;
    }

    setHistory((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        input: trimmed,
        output,
        timestamp: Date.now(),
        isError,
      },
    ]);
    setInput('');
    setHistoryIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        executeCommand(input);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const cmds = history.filter((h) => h.input);
        if (cmds.length === 0) return;
        const newIdx = historyIndex < cmds.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIdx);
        setInput(cmds[cmds.length - 1 - newIdx]?.input || '');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex <= 0) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          const cmds = history.filter((h) => h.input);
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          setInput(cmds[cmds.length - 1 - newIdx]?.input || '');
        }
      }
    },
    [input, history, historyIndex, executeCommand]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#313244] bg-[#181825]">
        <Info size={10} className="text-[#89b4fa]" />
        <span className="text-[10px] text-[#6c7086]">
          تيرمنال مبسّط — للتيرمنال الكامل افتح اللوحة السفلية
        </span>
      </div>

      {/* Output area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-[11px]"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Welcome message */}
        {history.length === 0 && (
          <div className="text-[#6c7086] mb-2">
            <p>مرحباً بك في CodeForge Terminal 🚀</p>
            <p className="mt-1">اكتب <span className="text-[#a6e3a1]">help</span> لعرض الأوامر المتوفرة</p>
          </div>
        )}

        {history.map((entry) => (
          <div key={entry.id} className="mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[#a6e3a1]">❯</span>
              <span className="text-[#cdd6f4]">{entry.input}</span>
            </div>
            <pre
              className={cn(
                'whitespace-pre-wrap mt-0.5 pl-3',
                entry.isError ? 'text-[#f38ba8]' : 'text-[#a6adc8]'
              )}
            >
              {entry.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[#313244] bg-[#181825]">
        <span className="text-[#a6e3a1] text-xs">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="أدخل أمراً..."
          className="flex-1 bg-transparent text-xs font-mono text-[#cdd6f4] placeholder:text-[#45475a] focus:outline-none"
          dir="ltr"
          autoFocus
        />
        <button
          onClick={() => executeCommand(input)}
          className="text-[#6c7086] hover:text-[#a6e3a1] transition-colors"
          title="تنفيذ"
        >
          <Play size={12} />
        </button>
        <button
          onClick={() => setHistory([])}
          className="text-[#6c7086] hover:text-[#f38ba8] transition-colors"
          title="مسح"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
