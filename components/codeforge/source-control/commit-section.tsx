'use client';

import { useState, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Check, ArrowUp, Loader2 } from 'lucide-react';

export default function CommitSection() {
  const { stagedFiles, commitChanges, pushChanges, isLoading } = useGitStore();
  const [message, setMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const canCommit = message.trim().length > 0 && stagedFiles.length > 0 && !isLoading;

  const handleCommit = async () => {
    if (!canCommit) return;

    setIsCommitting(true);
    try {
      await commitChanges(message.trim());
      setMessage('');
    } catch (err) {
      // Error handled by store
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!canCommit) return;

    setIsCommitting(true);
    try {
      await commitChanges(message.trim());
      await pushChanges();
      setMessage('');
    } catch (err) {
      // Error handled by store
    } finally {
      setIsCommitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <div className="space-y-2 border-b border-border p-2">
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message (Ctrl+Enter to commit)"
          disabled={isCommitting || isLoading}
          rows={3}
          className="w-full resize-none rounded border border-border bg-[hsl(var(--cf-editor))] px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        {message.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {message.length}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCommit}
          disabled={!canCommit || isCommitting}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          title="Commit staged changes"
        >
          {isCommitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Committing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Commit
            </>
          )}
        </button>

        <button
          onClick={handleCommitAndPush}
          disabled={!canCommit || isCommitting}
          className="flex items-center justify-center gap-2 rounded bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
          title="Commit and push to remote"
        >
          {isCommitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <ArrowUp className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {stagedFiles.length === 0 && (
        <p className="text-xs text-muted-foreground">No staged changes to commit</p>
      )}
    </div>
  );
}
