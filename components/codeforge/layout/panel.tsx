'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { AlertCircle, Bug, FileText, GitBranch, Terminal, X } from 'lucide-react';
import GitOutputPanel from '../source-control/git-output-panel';
import GitHistoryPanel from '../source-control/git-history-panel';
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
    <section
      role="region"
      aria-label="Bottom panel"
      style={{ height }}
      className="flex h-full flex-col border-t border-border bg-[hsl(var(--cf-panel))]"
    >
      <div 
        role="tablist" 
        aria-label="Panel sections"
        className="flex items-center justify-between border-b border-border"
      >
        <div className="flex">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${s.id}`}
                id={`tab-${s.id}`}
                onClick={() => setActive(s.id)}
                className={[
                  'flex items-center gap-2 border-r border-border px-4 py-2 text-sm transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-secondary',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={togglePanel}
          className="p-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          title="Close Panel"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div 
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className={`min-h-0 flex-1 overflow-y-auto ${active === 'git' ? '' : 'p-4'}`}
      >
        {active === 'terminal' && (
          <div className="rounded border-2 border-dashed border-muted-foreground/30 p-4">
            <p className="text-sm text-muted-foreground">
              xterm.js Terminal will be integrated here by Agent 6.
            </p>
          </div>
        )}

        {active === 'output' && (
          <p className="text-sm text-muted-foreground">
            Output logs will appear here...
          </p>
        )}

        {active === 'git' && (
          <div className="flex flex-col h-full">
            {/* Sub-tabs: Output | History */}
            <div 
              className="flex border-b border-border"
              role="tablist"
              aria-label="Git panel sections"
            >
              <button
                role="tab"
                aria-selected={gitSubTab === 'output'}
                aria-controls="git-output-panel"
                id="git-tab-output"
                onClick={() => setGitSubTab('output')}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  gitSubTab === 'output'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Output
              </button>
              <button
                role="tab"
                aria-selected={gitSubTab === 'history'}
                aria-controls="git-history-panel"
                id="git-tab-history"
                onClick={() => setGitSubTab('history')}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring',
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
                <div 
                  role="tabpanel"
                  id="git-output-panel"
                  aria-labelledby="git-tab-output"
                >
                  <GitOutputPanel entries={logEntries} onClear={handleClearLogs} />
                </div>
              )}
              {gitSubTab === 'history' && (
                <div 
                  role="tabpanel"
                  id="git-history-panel"
                  aria-labelledby="git-tab-history"
                >
                  <GitHistoryPanel />
                </div>
              )}
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
    </section>
  );
}
