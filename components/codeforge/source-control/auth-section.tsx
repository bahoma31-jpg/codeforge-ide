'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { Github, LogOut, Loader2, AlertCircle } from 'lucide-react';

export default function AuthSection() {
  const { isAuthenticated, user, isLoading, error, login, logout } = useGitStore();
  const [token, setToken] = useState('');
  const [showError, setShowError] = useState(true);

  const handleSignIn = async () => {
    if (!token.trim()) return;
    await login(token);
    setToken('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSignIn();
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.login}</p>
            <p className="text-xs text-muted-foreground truncate">{user.name || 'GitHub User'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Github className="w-5 h-5" />
        <h3 className="text-sm font-semibold">GitHub Authentication</h3>
      </div>

      {error && showError && (
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
      )}

      <div className="space-y-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Personal Access Token"
          disabled={isLoading}
          className="w-full px-2 py-1.5 text-sm bg-[hsl(var(--cf-editor))] border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />

        <button
          onClick={handleSignIn}
          disabled={isLoading || !token.trim()}
          className="w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>

        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-muted-foreground hover:text-foreground text-center underline"
        >
          How to get a token?
        </a>
      </div>
    </div>
  );
}
