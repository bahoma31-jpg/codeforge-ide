'use client';

/**
 * Displays the commit history for the current repository.
 * Placeholder — will be enhanced with actual git commit data.
 */
export default function GitHistoryPanel() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Commit history will appear here when a repository is loaded.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Use the Source Control panel to initialize or clone a repository.
        </p>
      </div>
    </div>
  );
}
