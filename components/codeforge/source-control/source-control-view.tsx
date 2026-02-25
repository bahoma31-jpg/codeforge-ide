'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Loader2, AlertCircle } from 'lucide-react';
import AuthSection from './auth-section';
import BranchSelector from './branch-selector';
import CommitSection from './commit-section';
import GitActionsBar from './git-actions-bar';
import ChangesList from './changes-list';
import CloneDialog from './clone-dialog';

export default function SourceControlView() {
  const { isAuthenticated, isLoading, error } = useGitStore();
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showError, setShowError] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Authentication Section */}
      <AuthSection />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-4 border-b border-border">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && showError && !isLoading && (
        <div className="p-2 border-b border-border">
          <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-500">{error}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="p-0.5 rounded hover:bg-red-500/20 text-red-500"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Authenticated Content */}
      {isAuthenticated && (
        <>
          {/* Branch Selector */}
          <BranchSelector />

          {/* Git Actions Bar */}
          <GitActionsBar onCloneClick={() => setShowCloneDialog(true)} />

          {/* Commit Input */}
          <CommitSection />

          {/* Changes List */}
          <ChangesList />
        </>
      )}

      {/* Clone Dialog */}
      <CloneDialog
        isOpen={showCloneDialog}
        onClose={() => setShowCloneDialog(false)}
      />
    </div>
  );
}
