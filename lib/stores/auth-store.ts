/**
 * CodeForge IDE — Auth Store
 * GitHub authentication state management.
 * Uses Personal Access Token (PAT) approach for browser-based IDE.
 *
 * Security:
 * - Token is stored in sessionStorage (cleared when tab closes)
 * - Token is AES-GCM encrypted before storage
 * - Single source of truth: all other stores read token via useAuthStore
 */

import { create } from 'zustand';
import type { GitHubUser } from '@/lib/services/github.service';
import { validateToken } from '@/lib/services/github.service';
import { encryptValue, decryptValue } from '@/lib/utils/crypto';

const TOKEN_KEY = 'codeforge-github-token';

export interface AuthState {
  /** Current authenticated user (null if not signed in) */
  user: GitHubUser | null;
  /** GitHub PAT (in-memory only — never read from storage directly) */
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
  /** Restore session from sessionStorage on app start */
  restoreSession: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  signIn: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await validateToken(token);

      // Persist encrypted token in sessionStorage (cleared on tab close)
      if (typeof window !== 'undefined') {
        const encrypted = await encryptValue(token);
        sessionStorage.setItem(TOKEN_KEY, encrypted);
        // Remove any legacy localStorage entry
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('codeforge-agent-config');
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
      sessionStorage.removeItem(TOKEN_KEY);
      // Clean up any legacy keys
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('codeforge-agent-config');
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

    const encrypted = sessionStorage.getItem(TOKEN_KEY);
    if (!encrypted) return;

    set({ isLoading: true });
    try {
      const token = await decryptValue(encrypted);
      if (!token) {
        // Decryption failed — discard
        sessionStorage.removeItem(TOKEN_KEY);
        set({ isLoading: false });
        return;
      }

      const user = await validateToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token expired or invalid — clean up silently
      sessionStorage.removeItem(TOKEN_KEY);
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
