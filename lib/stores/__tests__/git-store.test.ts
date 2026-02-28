/**
 * اختبارات وحدة لـ Git Store
 * يغطي: الحالة الأولية، staging/unstaging، commit message، change counting
 *
 * ملاحظة: الدوال التي تعتمد على خدمات خارجية (push, pull, takeSnapshot, detectChanges)
 * لا تُختبر هنا لأنها تحتاج mock كامل لـ IndexedDB + GitHub API.
 * نركز على الـ state management الصرف.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGitStore, type TrackedChange } from '../git-store';

// ─── Helpers ──────────────────────────────────────────────────

function resetStore() {
  useGitStore.setState({
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
  });
}

/**
 * بيانات وهمية — تغييرات مكتشفة
 */
function createMockChanges(): TrackedChange[] {
  return [
    {
      path: 'src/index.ts',
      status: 'modified',
      originalContent: 'old code',
      currentContent: 'new code',
      staged: false,
    },
    {
      path: 'src/new-file.ts',
      status: 'added',
      currentContent: 'brand new content',
      staged: false,
    },
    {
      path: 'src/removed.ts',
      status: 'deleted',
      originalContent: 'deleted content',
      staged: false,
    },
  ];
}

// ─── Tests ────────────────────────────────────────────────────

describe('GitStore', () => {
  beforeEach(() => resetStore());

  // ── الحالة الأولية ──

  describe('Initial State', () => {
    it('should have no repo context initially', () => {
      expect(useGitStore.getState().repoContext).toBeNull();
    });

    it('should have empty changes', () => {
      expect(useGitStore.getState().changes).toHaveLength(0);
    });

    it('should have empty commit message', () => {
      expect(useGitStore.getState().commitMessage).toBe('');
    });

    it('should not be pushing initially', () => {
      expect(useGitStore.getState().isPushing).toBe(false);
    });

    it('should not be pulling initially', () => {
      expect(useGitStore.getState().isPulling).toBe(false);
    });

    it('should have no error initially', () => {
      expect(useGitStore.getState().error).toBeNull();
    });

    it('should have empty snapshot', () => {
      expect(useGitStore.getState().snapshot.size).toBe(0);
    });
  });

  // ── setRepoContext ──

  describe('setRepoContext', () => {
    it('should set repo context', () => {
      const ctx = {
        owner: 'bahoma31-jpg',
        repo: 'codeforge-ide',
        branch: 'main',
        clonedAt: Date.now(),
      };

      useGitStore.getState().setRepoContext(ctx);

      const state = useGitStore.getState();
      expect(state.repoContext).toEqual(ctx);
      expect(state.repoContext?.owner).toBe('bahoma31-jpg');
    });
  });

  // ── setCommitMessage ──

  describe('setCommitMessage', () => {
    it('should set commit message', () => {
      useGitStore.getState().setCommitMessage('feat: add new component');
      expect(useGitStore.getState().commitMessage).toBe(
        'feat: add new component'
      );
    });

    it('should allow empty commit message', () => {
      useGitStore.getState().setCommitMessage('some text');
      useGitStore.getState().setCommitMessage('');
      expect(useGitStore.getState().commitMessage).toBe('');
    });
  });

  // ── stageFile / unstageFile ──

  describe('stageFile', () => {
    it('should stage a file by path', () => {
      useGitStore.setState({ changes: createMockChanges() });

      useGitStore.getState().stageFile('src/index.ts');

      const change = useGitStore
        .getState()
        .changes.find((c) => c.path === 'src/index.ts');
      expect(change?.staged).toBe(true);
    });

    it('should not affect other files', () => {
      useGitStore.setState({ changes: createMockChanges() });

      useGitStore.getState().stageFile('src/index.ts');

      const other = useGitStore
        .getState()
        .changes.find((c) => c.path === 'src/new-file.ts');
      expect(other?.staged).toBe(false);
    });

    it('should handle staging non-existent path gracefully', () => {
      useGitStore.setState({ changes: createMockChanges() });

      expect(() => {
        useGitStore.getState().stageFile('non-existent.ts');
      }).not.toThrow();

      // لا يجب أن يتغير شيء
      expect(
        useGitStore.getState().changes.every((c) => c.staged === false)
      ).toBe(true);
    });
  });

  describe('unstageFile', () => {
    it('should unstage a staged file', () => {
      const changes = createMockChanges();
      changes[0].staged = true;
      useGitStore.setState({ changes });

      useGitStore.getState().unstageFile('src/index.ts');

      const change = useGitStore
        .getState()
        .changes.find((c) => c.path === 'src/index.ts');
      expect(change?.staged).toBe(false);
    });
  });

  // ── stageAll / unstageAll ──

  describe('stageAll', () => {
    it('should stage all changes', () => {
      useGitStore.setState({ changes: createMockChanges() });

      useGitStore.getState().stageAll();

      const allStaged = useGitStore
        .getState()
        .changes.every((c) => c.staged === true);
      expect(allStaged).toBe(true);
    });
  });

  describe('unstageAll', () => {
    it('should unstage all changes', () => {
      const changes = createMockChanges();
      changes.forEach((c) => (c.staged = true));
      useGitStore.setState({ changes });

      useGitStore.getState().unstageAll();

      const allUnstaged = useGitStore
        .getState()
        .changes.every((c) => c.staged === false);
      expect(allUnstaged).toBe(true);
    });
  });

  // ── getStagedChanges ──

  describe('getStagedChanges', () => {
    it('should return only staged changes', () => {
      const changes = createMockChanges();
      changes[0].staged = true;
      changes[2].staged = true;
      useGitStore.setState({ changes });

      const staged = useGitStore.getState().getStagedChanges();
      expect(staged).toHaveLength(2);
      expect(staged[0].path).toBe('src/index.ts');
      expect(staged[1].path).toBe('src/removed.ts');
    });

    it('should return empty array when nothing is staged', () => {
      useGitStore.setState({ changes: createMockChanges() });
      expect(useGitStore.getState().getStagedChanges()).toHaveLength(0);
    });
  });

  // ── getChangeCount ──

  describe('getChangeCount', () => {
    it('should return correct total and staged counts', () => {
      const changes = createMockChanges();
      changes[0].staged = true;
      useGitStore.setState({ changes });

      const count = useGitStore.getState().getChangeCount();
      expect(count.total).toBe(3);
      expect(count.staged).toBe(1);
    });

    it('should return zeros when no changes', () => {
      const count = useGitStore.getState().getChangeCount();
      expect(count.total).toBe(0);
      expect(count.staged).toBe(0);
    });
  });

  // ── clearError ──

  describe('clearError', () => {
    it('should set error to null', () => {
      useGitStore.setState({ error: 'فشل الدفع' });
      useGitStore.getState().clearError();
      expect(useGitStore.getState().error).toBeNull();
    });
  });
});
