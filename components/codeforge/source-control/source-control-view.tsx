'use client';

import { useState, useEffect } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Loader2, AlertCircle, X } from 'lucide-react';
import AuthSection from './auth-section';
import BranchSelector from './branch-selector';
import CommitSection from './commit-section';
import GitActionsBar from './git-actions-bar';
import ChangesList from './changes-list';
import CloneDialog from './clone-dialog';

export default function SourceControlView() {
  const { isAuthenticated, currentRepo, isLoading, error, clearError, initialize } = useGitStore();
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Initializing Git...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Global Error Banner */}
      {error && (
        <div className="border-b border-border bg-destructive/10 p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <p className="flex-1 text-xs text-destructive">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auth Section - Always visible */}
      <AuthSection />

      {/* Main Content - Only when authenticated */}
      {isAuthenticated && (
        <>
          {/* Repository Controls */}
          {currentRepo ? (
            <>
              <BranchSelector />
              <CommitSection />
              <GitActionsBar onClone={() => setShowCloneDialog(true)} />
            </>
          ) : (
            <div className="border-b border-border p-3">
              <button
                onClick={() => setShowCloneDialog(true)}
                className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Clone Repository
              </button>
            </div>
          )}

          {/* Changes List */}
          <div className="flex-1 overflow-y-auto">
            {currentRepo ? (
              <ChangesList />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">No repository open</p>
                <p className="text-xs text-muted-foreground">Clone a repository to get started</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Clone Dialog */}
      <CloneDialog isOpen={showCloneDialog} onClose={() => setShowCloneDialog(false)} />
    </div>
  );
}
