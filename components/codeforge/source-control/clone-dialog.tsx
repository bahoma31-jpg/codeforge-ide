'use client';

import { useState, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { X, Loader2, FolderGit2, CheckCircle, AlertCircle } from 'lucide-react';

type CloneDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CloneDialog({ isOpen, onClose }: CloneDialogProps) {
  const { cloneRepo, cloneProgress, isLoading, error, clearError } = useGitStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<'idle' | 'cloning' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setRepoUrl('');
      setIsCloning(false);
      setCloneStatus('idle');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleClone = async () => {
    if (!repoUrl.trim()) return;

    setIsCloning(true);
    setCloneStatus('cloning');
    clearError();

    try {
      await cloneRepo(repoUrl.trim());
      setCloneStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setCloneStatus('error');
    } finally {
      setIsCloning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleClone();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={cloneStatus === 'cloning' ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-[hsl(var(--cf-sidebar))] p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Clone Repository</h2>
          </div>
          {cloneStatus !== 'cloning' && (
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="repo-url" className="text-sm font-medium">
              Repository URL
            </label>
            <input
              id="repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/owner/repo"
              disabled={isCloning}
              className="w-full rounded border border-border bg-[hsl(var(--cf-editor))] px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Progress Bar */}
          {cloneStatus === 'cloning' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cloning...</span>
                <span className="font-medium">{Math.round(cloneProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${cloneProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {cloneStatus === 'success' && (
            <div className="flex items-start gap-2 rounded bg-green-500/10 p-3 text-sm text-green-500">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Repository cloned successfully!</p>
                <p className="text-xs">Files are now available in the explorer.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {cloneStatus === 'error' && error && (
            <div className="flex items-start gap-2 rounded bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Clone failed</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClone}
              disabled={!repoUrl.trim() || isCloning}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCloning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone'
              )}
            </button>
            {cloneStatus !== 'cloning' && (
              <button
                onClick={onClose}
                className="rounded bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
