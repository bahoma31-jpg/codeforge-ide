'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { useGitStore } from '@/lib/stores/git-store';
import { setTheme as persistTheme, toggleTheme } from '@/lib/utils/theme';
import { GitBranch, Moon, Sun, Loader2, Cloud, CloudOff } from 'lucide-react';

export default function StatusBar() {
  const { theme, setTheme } = useUIStore();
  const { isAuthenticated, currentBranch, currentRepo, status, isLoading } = useGitStore();

  const onToggleTheme = () => {
    const next = toggleTheme(theme);
    setTheme(next);
    persistTheme(next);
  };

  // Calculate total changes
  const totalChanges =
    status.modified.length + status.added.length + status.deleted.length;

  return (
    <footer className="flex h-[22px] items-center justify-between border-t border-border bg-[hsl(var(--cf-statusbar))] px-3 text-xs text-white">
      <div className="flex items-center gap-4">
        {/* Branch */}
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{currentBranch || 'main'}</span>
        </div>

        {/* Repo name (if authenticated) */}
        {isAuthenticated && currentRepo && (
          <span className="opacity-70">{currentRepo.name}</span>
        )}

        {/* Loading indicator */}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}

        {/* Connection status */}
        {isAuthenticated && currentRepo ? (
          <Cloud className="h-3 w-3 opacity-70" title="Connected to GitHub" />
        ) : (
          <CloudOff className="h-3 w-3 opacity-70" title="Not connected" />
        )}

        <span>UTF-8</span>
        <span>Ln 1, Col 1</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Changes indicator */}
        {totalChanges > 0 && (
          <span className="flex items-center gap-1">
            <span>⚡</span>
            <span>{totalChanges} change{totalChanges !== 1 ? 's' : ''}</span>
          </span>
        )}

        <span>TypeScript</span>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1 hover:opacity-80"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-3 w-3" />
          ) : (
            <Sun className="h-3 w-3" />
          )}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </footer>
  );
}
