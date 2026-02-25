'use client';

import type { GitLogEntry } from '@/lib/utils/git-log';

const typeColors: Record<GitLogEntry['type'], string> = {
  info: 'text-blue-400',
  error: 'text-red-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
};

interface GitOutputPanelProps {
  entries: GitLogEntry[];
  onClear: () => void;
}

/**
 * Displays a scrollable list of git operation logs.
 */
export default function GitOutputPanel({
  entries,
  onClear,
}: GitOutputPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          No git output yet. Run a git command to see logs here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-border px-2 py-1">
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {entries.map((entry) => (
          <div key={entry.id} className="mb-1">
            <span className="text-muted-foreground">
              [{new Date(entry.timestamp).toLocaleTimeString()}]
            </span>{' '}
            <span className={typeColors[entry.type]}>
              $ {entry.command}
            </span>
            {entry.output && (
              <pre className="ml-4 whitespace-pre-wrap text-muted-foreground">
                {entry.output}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
