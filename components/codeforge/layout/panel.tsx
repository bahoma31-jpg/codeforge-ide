'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { AlertCircle, Bug, FileText, GitBranch, Terminal, X } from 'lucide-react';
import GitOutputPanel from '../source-control/git-output-panel';
import GitHistoryPanel from '../source-control/git-history-panel';
import TerminalWrapper from '../terminal/terminal-wrapper';
import { getGitLogs, clearGitLogs, subscribeToGitLogs } from '@/lib/utils/git-log';
import type { GitLogEntry } from '@/lib/utils/git-log';

const sections = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'output', icon: FileText, label: 'Output' },
  { id: 'git', icon: GitBranch, label: 'Git' },
  { id: 'problems', icon: AlertCircle, label: 'Problems' },
  { id: 'debug', icon: Bug, label: 'Debug Console' },
] as const;

type SectionId = (typeof sections)[number]['id'];

/**
 * Panel component — bottom panel of the IDE layout.
 * Contains tabs for Terminal, Output, Git (with Output/History sub-tabs),
 * Problems, and Debug Console.
 */
export default function Panel({ height }: { height: number }) {
  const [active, setActive] = useState<SectionId>('terminal');
  const { togglePanel } = useUIStore();

  /** Git sub-tab state: toggles between output logs and commit history */
  const [gitSubTab, setGitSubTab] = useState<'output' | 'history'>('output');

  /** Reactive git log entries — updated via subscription */
  const [logEntries, setLogEntries] = useState<GitLogEntry[]>(getGitLogs());

  useEffect(() => {
    const unsubscribe = subscribeToGitLogs((entries: GitLogEntry[]) => {
      setLogEntries(entries);
    });
    return unsubscribe;
  }, []);

  /** Clears all git log entries */
  const handleClearLogs = (): void => {
    clearGitLogs();
  };

  return (
    <div
      style={{ height }}
      className="flex h-full flex-col border-t border-border bg-[hsl(var(--cf-panel))]"
    >
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={[
                  'flex items-center gap-2 border-r border-border px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-secondary',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={togglePanel}
          className="p-2 text-muted-foreground hover:text-foreground"
          title="Close Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${active === 'git' || active === 'terminal' ? '' : 'p-4'}`}>
        {active === 'terminal' && <TerminalWrapper />}

        {active === 'output' && (
          <p className="text-sm text-muted-foreground">
            Output logs will appear here...
          </p>
        )}

        {active === 'git' && (
          <div className="flex flex-col h-full">
            {/* Sub-tabs: Output | History */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setGitSubTab('output')}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  gitSubTab === 'output'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Output
              </button>
              <button
                onClick={() => setGitSubTab('history')}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  gitSubTab === 'history'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                History
              </button>
            </div>

            {/* Sub-tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {gitSubTab === 'output' && (
                <GitOutputPanel entries={logEntries} onClear={handleClearLogs} />
              )}
              {gitSubTab === 'history' && <GitHistoryPanel />}
            </div>
          </div>
        )}

        {active === 'problems' && (
          <p className="text-sm text-muted-foreground">
            Problems will appear here...
          </p>
        )}

        {active === 'debug' && (
          <p className="text-sm text-muted-foreground">
            Debug Console will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
