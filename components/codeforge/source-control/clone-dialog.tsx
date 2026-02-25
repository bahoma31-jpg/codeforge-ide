'use client';

import { useState, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { X, FolderGit2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CloneDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CloneDialog({ isOpen, onClose }: CloneDialogProps) {
  const { cloneProgress, cloneRepo } = useGitStore();
  const [url, setUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setUrl('');
      setIsCloning(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleClone = async () => {
    if (!url.trim()) return;

    setIsCloning(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await cloneRepo(url.trim());
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Failed to clone repository. Please check the URL and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsCloning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCloning) {
      e.preventDefault();
      handleClone();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-[hsl(var(--cf-sidebar))] rounded-lg shadow-lg w-full max-w-md mx-4 border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Clone Repository</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isCloning}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-500">Repository cloned successfully!</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/owner/repo"
              disabled={isCloning || success}
              className="w-full px-3 py-2 text-sm bg-[hsl(var(--cf-editor))] border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              autoFocus
            />
          </div>

          {isCloning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cloning...</span>
                <span className="font-medium">{cloneProgress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${cloneProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isCloning}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={!url.trim() || isCloning || success}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCloning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cloning...</span>
              </>
            ) : (
              <span>Clone</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
