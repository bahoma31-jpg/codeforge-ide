'use client';

import { useState, useRef, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { RefreshCw, ArrowDown, ArrowUp, MoreHorizontal, FolderGit2 } from 'lucide-react';

interface GitActionsBarProps {
  onCloneClick: () => void;
}

export default function GitActionsBar({ onCloneClick }: GitActionsBarProps) {
  const { isLoading, refreshStatus, pullChanges, pushChanges } = useGitStore();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

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
    await refreshStatus();
  };

  const handlePull = async () => {
    await pullChanges();
  };

  const handlePush = async () => {
    await pushChanges();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border">
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </button>

      <button
        onClick={handlePull}
        disabled={isLoading}
        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title="Pull"
      >
        <ArrowDown className="w-4 h-4" />
      </button>

      <button
        onClick={handlePush}
        disabled={isLoading}
        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title="Push"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setShowMore(!showMore)}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="More"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMore && (
          <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--cf-sidebar))] border border-border rounded shadow-lg z-50 min-w-[160px]">
            <button
              onClick={() => {
                onCloneClick();
                setShowMore(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-sm text-left"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Clone Repository</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
