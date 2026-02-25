'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { GitCommit, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/git-log';

export default function GitHistoryPanel() {
  const { commits, isLoading, refreshCommits } = useGitStore();
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  const toggleExpand = (sha: string) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) {
        next.delete(sha);
      } else {
        next.add(sha);
      }
      return next;
    });
  };

  const handleRefresh = async () => {
    await refreshCommits();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Commit History
        </span>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh commits"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Commits List */}
      <div className="flex-1 overflow-y-auto">
        {commits.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-xs text-muted-foreground">No commits yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            {/* Commits */}
            <div className="space-y-0">
              {commits.map((commit) => {
                const isExpanded = expandedCommits.has(commit.sha);
                const shortSha = commit.sha.substring(0, 7);
                const firstLine = commit.message.split('\n')[0];
                const truncatedMessage =
                  firstLine.length > 50
                    ? firstLine.substring(0, 50) + '...'
                    : firstLine;

                return (
                  <div key={commit.sha} className="relative">
                    <button
                      onClick={() => toggleExpand(commit.sha)}
                      className="w-full text-left hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-start gap-3 p-2 pl-3">
                        {/* Timeline node */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[hsl(var(--cf-sidebar))] border-2 border-primary flex items-center justify-center">
                            <GitCommit className="w-3 h-3 text-primary" />
                          </div>
                        </div>

                        {/* Commit info */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono text-primary font-semibold">
                              {shortSha}
                            </code>
                            {!isExpanded && <ChevronRight className="w-3 h-3" />}
                            {isExpanded && <ChevronDown className="w-3 h-3" />}
                          </div>

                          <p className="text-sm mb-1">
                            {isExpanded ? commit.message : truncatedMessage}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{commit.author}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(new Date(commit.date))}</span>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-2 p-2 rounded bg-secondary/50 font-mono text-xs">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-muted-foreground">SHA:</span>{' '}
                                  <code className="text-primary">{commit.sha}</code>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Author:</span>{' '}
                                  {commit.author}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Date:</span>{' '}
                                  {new Date(commit.date).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
