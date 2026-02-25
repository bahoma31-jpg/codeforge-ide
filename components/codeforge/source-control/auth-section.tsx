'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Github, LogOut, Loader2, ExternalLink } from 'lucide-react';

export default function AuthSection() {
  const { isAuthenticated, user, login, logout, isLoading, error, clearError } = useGitStore();
  const [token, setToken] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (!token.trim()) return;

    setIsSigningIn(true);
    try {
      await login(token);
      setToken('');
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSignIn();
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="space-y-3 border-b border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.login}</span>
              <span className="text-xs text-muted-foreground">{user.email || 'GitHub User'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            disabled={isLoading}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-b border-border p-3">
      <div className="flex items-center gap-2">
        <Github className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-semibold">GitHub Authentication</h3>
      </div>

      {error && (
        <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
          <div className="flex items-start justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Personal Access Token"
          disabled={isSigningIn}
          className="w-full rounded border border-border bg-[hsl(var(--cf-editor))] px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />

        <button
          onClick={handleSignIn}
          disabled={!token.trim() || isSigningIn}
          className="flex w-full items-center justify-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          How to get a token?
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
