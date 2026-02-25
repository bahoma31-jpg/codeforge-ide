'use client';

import { useState, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Check, ArrowUp } from 'lucide-react';

export default function CommitSection() {
  const { stagedFiles, isLoading, commitChanges, pushChanges } = useGitStore();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && message.trim() && stagedFiles.length > 0 && !isLoading) {
        handleCommit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, stagedFiles, isLoading]);

  const handleCommit = async () => {
    if (!message.trim() || stagedFiles.length === 0 || isLoading) return;
    
    const success = await commitChanges(message.trim());
    if (success) {
      setMessage('');
    }
  };

  const handleCommitAndPush = async () => {
    if (!message.trim() || stagedFiles.length === 0 || isLoading) return;
    
    const commitSuccess = await commitChanges(message.trim());
    if (commitSuccess) {
      setMessage('');
      await pushChanges();
    }
  };

  const isDisabled = !message.trim() || stagedFiles.length === 0 || isLoading;

  return (
    <div className="p-2 space-y-2 border-b border-border">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message (Ctrl+Enter to commit)"
        disabled={isLoading}
        rows={3}
        className="w-full px-2 py-1.5 text-sm bg-[hsl(var(--cf-editor))] border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
      />

      {message.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          {message.length} characters
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCommit}
          disabled={isDisabled}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Commit staged changes"
        >
          <Check className="w-4 h-4" />
          <span>Commit</span>
        </button>

        <button
          onClick={handleCommitAndPush}
          disabled={isDisabled}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Commit and push to remote"
        >
          <Check className="w-4 h-4" />
          <ArrowUp className="w-4 h-4" />
          <span>Commit & Push</span>
        </button>
      </div>
    </div>
  );
}
