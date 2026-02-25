'use client';

import { useRef, useEffect } from 'react';
import { Info, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import type { GitLogEntry } from '@/lib/utils/git-log';

interface GitOutputPanelProps {
  entries: GitLogEntry[];
  onClear: () => void;
}

export default function GitOutputPanel({ entries, onClear }: GitOutputPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries added
  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  const getIcon = (type: GitLogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">
          No Git activity yet. Clone a repository to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Clear button */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Git Output
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
          title="Clear output"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            ref={index === entries.length - 1 ? lastEntryRef : null}
            className="flex items-start gap-2 py-1"
          >
            {/* Timestamp */}
            <span className="text-muted-foreground flex-shrink-0">
              [{formatTime(entry.timestamp)}]
            </span>

            {/* Icon */}
            {getIcon(entry.type)}

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="break-words">{entry.message}</p>
              {entry.details && (
                <p className="text-muted-foreground mt-0.5">{entry.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
