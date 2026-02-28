/**
 * CodeForge IDE — Git Store
 * Source control state management.
 *
 * Tracks file changes (modified/added/deleted) compared to the
 * cloned snapshot, and orchestrates push operations using the
 * Git Data API for atomic multi-file commits.
 */

import { create } from 'zustand';
import { logger } from '@/lib/monitoring/error-logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FileNode } from '@/lib/db/schema';
import { getAllNodes } from '@/lib/db/file-operations';
import { useAuthStore } from './auth-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useFilesStore } from './files-store';
import {
  pushChanges,
  type FileChange,
  type CommitResult,
} from '@/lib/services/github-write.service';
import { cloneRepository } from '@/lib/services/github.service';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FileStatus = 'modified' | 'added' | 'deleted';

export interface TrackedChange {
  path: string;
  status: FileStatus;
  originalContent?: string;
  currentContent?: string;
  staged: boolean;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  clonedAt: number;
}

export interface GitState {
  /** Current repository context (set after clone) */
  repoContext: RepoContext | null;

  /** Snapshot of files at clone time (path → content) */
  snapshot: Map<string, string>;

  /** Tracked changes */
  changes: TrackedChange[];

  /** Commit message input */
  commitMessage: string;

  /** Operation states */
  isPushing: boolean;
  isPulling: boolean;
  pushProgress: { msg: string; pct: number };
  pullProgress: { msg: string; pct: number };
  lastPushResult: CommitResult | null;
  error: string | null;

  /** Actions */
  setRepoContext: (ctx: RepoContext) => void;
  takeSnapshot: () => Promise<void>;
  detectChanges: () => Promise<void>;
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  setCommitMessage: (msg: string) => void;
  push: () => Promise<CommitResult>;
  pull: () => Promise<void>;
  clearError: () => void;
  getStagedChanges: () => TrackedChange[];
  getChangeCount: () => { total: number; staged: number };
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useGitStore = create<GitState>((set, get) => ({
  repoContext: null,
  snapshot: new Map(),
  changes: [],
  commitMessage: '',
  isPushing: false,
  isPulling: false,
  pushProgress: { msg: '', pct: 0 },
  pullProgress: { msg: '', pct: 0 },
  lastPushResult: null,
  error: null,

  setRepoContext: (ctx) => set({ repoContext: ctx }),

  /**
   * Take a snapshot of all current files.
   * Called right after cloning to establish the "baseline".
   */
  takeSnapshot: async () => {
    try {
      const allNodes = await getAllNodes();
      const snapshot = new Map<string, string>();

      for (const node of allNodes) {
        if (node.type === 'file' && node.content !== undefined) {
          // Store path relative to root (remove leading /repoName/)
          const parts = node.path.split('/');
          const relativePath =
            parts.length > 2 ? parts.slice(2).join('/') : node.name;
          snapshot.set(relativePath, node.content);
        }
      }

      set({ snapshot, changes: [] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'فشل أخذ لقطة الملفات';
      logger.error(
        'فشل أخذ لقطة الملفات',
        error instanceof Error ? error : undefined,
        { source: 'GitStore.takeSnapshot' }
      );
      set({ error: message });
    }
  },

  /**
   * Compare current files against the snapshot to detect changes.
   */
  detectChanges: async () => {
    const { snapshot } = get();
    const allNodes = await getAllNodes();
    const changes: TrackedChange[] = [];
    const currentPaths = new Set<string>();

    for (const node of allNodes) {
      if (node.type !== 'file') continue;

      const parts = node.path.split('/');
      const relativePath =
        parts.length > 2 ? parts.slice(2).join('/') : node.name;
      currentPaths.add(relativePath);

      const originalContent = snapshot.get(relativePath);
      const currentContent = node.content || '';

      if (originalContent === undefined) {
        // New file
        changes.push({
          path: relativePath,
          status: 'added',
          currentContent,
          staged: false,
        });
      } else if (originalContent !== currentContent) {
        // Modified file
        changes.push({
          path: relativePath,
          status: 'modified',
          originalContent,
          currentContent,
          staged: false,
        });
      }
    }

    // Detect deleted files
    for (const [path, content] of snapshot) {
      if (!currentPaths.has(path)) {
        changes.push({
          path,
          status: 'deleted',
          originalContent: content,
          staged: false,
        });
      }
    }

    // Preserve staged status from previous state
    const prevChanges = get().changes;
    const prevStaged = new Set(
      prevChanges.filter((c) => c.staged).map((c) => c.path)
    );

    for (const change of changes) {
      if (prevStaged.has(change.path)) {
        change.staged = true;
      }
    }

    set({ changes });
  },

  stageFile: (path) => {
    if (!path || typeof path !== 'string') {
      logger.warn('المسار مطلوب لعملية stage', {
        source: 'GitStore.stageFile',
      });
      return;
    }
    set((state) => ({
      changes: state.changes.map((c) =>
        c.path === path ? { ...c, staged: true } : c
      ),
    }));
  },

  unstageFile: (path) => {
    if (!path || typeof path !== 'string') {
      logger.warn('المسار مطلوب لعملية unstage', {
        source: 'GitStore.unstageFile',
      });
      return;
    }
    set((state) => ({
      changes: state.changes.map((c) =>
        c.path === path ? { ...c, staged: false } : c
      ),
    }));
  },

  stageAll: () => {
    set((state) => ({
      changes: state.changes.map((c) => ({ ...c, staged: true })),
    }));
  },

  unstageAll: () => {
    set((state) => ({
      changes: state.changes.map((c) => ({ ...c, staged: false })),
    }));
  },

  setCommitMessage: (msg) => set({ commitMessage: msg }),

  getStagedChanges: () => get().changes.filter((c) => c.staged),

  getChangeCount: () => {
    const changes = get().changes;
    return {
      total: changes.length,
      staged: changes.filter((c) => c.staged).length,
    };
  },

  /**
   * Push all staged changes to GitHub in a single atomic commit.
   */
  push: async () => {
    const { repoContext, commitMessage, changes } = get();
    const { token } = useAuthStore.getState();

    if (!repoContext) throw new Error('لا يوجد مستودع متصل.');
    if (!token) throw new Error('يجب تسجيل الدخول أولاً.');

    const staged = changes.filter((c) => c.staged);
    if (staged.length === 0) throw new Error('لا توجد ملفات محددة للدفع.');
    if (!commitMessage.trim()) throw new Error('رسالة الـ commit مطلوبة.');

    set({
      isPushing: true,
      error: null,
      pushProgress: { msg: 'جاري البدء…', pct: 0 },
    });

    try {
      // Convert tracked changes to FileChange format
      const fileChanges: FileChange[] = staged.map((change) => {
        if (change.status === 'deleted') {
          return { path: change.path, action: 'delete' as const };
        }
        return {
          path: change.path,
          content: change.currentContent || '',
          action:
            change.status === 'added'
              ? ('create' as const)
              : ('update' as const),
        };
      });

      const result = await pushChanges(
        repoContext.owner,
        repoContext.repo,
        repoContext.branch,
        commitMessage.trim(),
        fileChanges,
        token,
        (msg, pct) => set({ pushProgress: { msg, pct } })
      );

      // After successful push: update snapshot with new state
      const newSnapshot = new Map(get().snapshot);
      for (const change of staged) {
        if (change.status === 'deleted') {
          newSnapshot.delete(change.path);
        } else {
          newSnapshot.set(change.path, change.currentContent || '');
        }
      }

      // Remove pushed changes from the list
      const stagedPaths = new Set(staged.map((c) => c.path));
      const remainingChanges = get().changes.filter(
        (c) => !stagedPaths.has(c.path)
      );

      set({
        isPushing: false,
        lastPushResult: result,
        commitMessage: '',
        snapshot: newSnapshot,
        changes: remainingChanges,
        pushProgress: { msg: 'تم الدفع بنجاح! ✓', pct: 100 },
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل الدفع';
      set({ isPushing: false, error: message });
      throw err;
    }
  },

  /**
   * Pull latest changes (re-clone the repository).
   */
  pull: async () => {
    const { repoContext } = get();
    const { token } = useAuthStore.getState();

    if (!repoContext) throw new Error('لا يوجد مستودع متصل.');
    if (!token) throw new Error('يجب تسجيل الدخول أولاً.');

    set({
      isPulling: true,
      error: null,
      pullProgress: { msg: 'جاري السحب…', pct: 0 },
    });

    try {
      await cloneRepository(
        repoContext.owner,
        repoContext.repo,
        token,
        repoContext.branch,
        (msg, pct) => set({ pullProgress: { msg, pct } })
      );

      // Re-take snapshot after pull
      await get().takeSnapshot();

      set({
        isPulling: false,
        changes: [],
        pullProgress: { msg: 'تم السحب بنجاح! ✓', pct: 100 },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل السحب';
      set({ isPulling: false, error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
