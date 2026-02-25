'use client';

import { useState, useRef, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { RefreshCw, ArrowDown, ArrowUp, MoreHorizontal, FolderGit2 } from 'lucide-react';

type GitActionsBarProps = {
  onClone: () => void;
};

export default function GitActionsBar({ onClone }: GitActionsBarProps) {
  const { refreshStatus, pullChanges, pushChanges, isLoading } = useGitStore();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshStatus();
    } catch (err) {
      // Error handled by store
    }
  };

  const handlePull = async () => {
    try {
      await pullChanges();
    } catch (err) {
      // Error handled by store
    }
  };

  const handlePush = async () => {
    try {
      await pushChanges();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-2 py-1">
      <div className="flex items-center gap-1">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handlePull}
          disabled={isLoading}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title="Pull from remote"
        >
          <ArrowDown className="h-4 w-4" />
        </button>

        <button
          onClick={handlePush}
          disabled={isLoading}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title="Push to remote"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div ref={moreRef} className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          disabled={isLoading}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showMore && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded border border-border bg-[hsl(var(--cf-sidebar))] py-1 shadow-lg">
            <button
              onClick={() => {
                onClone();
                setShowMore(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary"
            >
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              Clone Repository
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
