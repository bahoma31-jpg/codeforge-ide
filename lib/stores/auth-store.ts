/**
 * CodeForge IDE — Auth Store
 * GitHub authentication state management.
 * Uses Personal Access Token (PAT) approach for browser-based IDE.
 * Token is stored in localStorage (client-side only).
 */

import { create } from 'zustand';
import type { GitHubUser } from '@/lib/services/github.service';
import { validateToken } from '@/lib/services/github.service';

const TOKEN_KEY = 'codeforge-github-token';

export interface AuthState {
  /** Current authenticated user (null if not signed in) */
  user: GitHubUser | null;
  /** GitHub PAT */
  token: string | null;
  /** Whether auth is being checked */
  isLoading: boolean;
  /** Auth error message */
  error: string | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Sign in with a Personal Access Token */
  signIn: (token: string) => Promise<void>;
  /** Sign out and clear stored token */
  signOut: () => void;
  /** Restore session from localStorage on app start */
  restoreSession: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  signIn: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await validateToken(token);

      // Persist token
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to authenticate';
      set({
        error: message,
        isLoading: false,
        user: null,
        token: null,
        isAuthenticated: false,
      });
      throw err;
    }
  },

  signOut: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await validateToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token expired or invalid — clean up silently
      localStorage.removeItem(TOKEN_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
