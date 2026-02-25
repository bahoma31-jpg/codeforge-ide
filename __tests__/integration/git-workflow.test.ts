import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGitStore } from '@/lib/stores/git-store';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';

/**
 * Integration Tests: Git Workflow
 * Tests end-to-end Git operations: clone → edit → commit → push
 */
describe('Git Workflow Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useGitStore.getState().reset?.();
    useFilesStore.getState().reset?.();
    useEditorStore.getState().setOpenFiles([]);
    useEditorStore.getState().setActiveFile(null);
  });

  describe('Complete Workflow: Clone to Push', () => {
    it('should handle full workflow: clone → edit → stage → commit → push', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      // Step 1: Clone repository
      const cloneResult = await gitStore.cloneRepository(
        'https://github.com/test/repo.git',
        '/local/path'
      );

      expect(cloneResult.success).toBe(true);
      expect(gitStore.isInitialized).toBe(true);

      // Step 2: Create and edit file
      filesStore.createFile('test.ts', 'const x = 1;');
      editorStore.openFile('test.ts', 'const x = 1;');

      // Edit file content
      editorStore.updateFileContent('test.ts', 'const x = 2;');
      filesStore.updateFileContent('test.ts', 'const x = 2;');

      // Step 3: Check status - should show modified file
      const status = await gitStore.getStatus();
      expect(status.modified).toContain('test.ts');

      // Step 4: Stage the file
      await gitStore.stageFile('test.ts');
      const statusAfterStage = await gitStore.getStatus();
      expect(statusAfterStage.staged).toContain('test.ts');

      // Step 5: Commit changes
      const commitResult = await gitStore.commit('test: update test file');
      expect(commitResult.success).toBe(true);
      expect(commitResult.sha).toBeDefined();

      // Step 6: Push to remote
      const pushResult = await gitStore.push();
      expect(pushResult.success).toBe(true);
    });

    it('should handle workflow with multiple files', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      // Initialize repository
      await gitStore.initRepository('/test');

      // Create multiple files
      filesStore.createFile('file1.ts', 'content1');
      filesStore.createFile('file2.ts', 'content2');
      filesStore.createFile('file3.ts', 'content3');

      // Stage all files
      await gitStore.stageFile('file1.ts');
      await gitStore.stageFile('file2.ts');
      await gitStore.stageFile('file3.ts');

      // Commit
      const commitResult = await gitStore.commit('feat: add multiple files');
      expect(commitResult.success).toBe(true);

      // Verify all files are committed
      const history = await gitStore.getCommitHistory();
      expect(history[0].message).toBe('feat: add multiple files');
    });
  });

  describe('Branch Workflow', () => {
    it('should handle creating and switching branches', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      // Create initial commit
      const filesStore = useFilesStore.getState();
      filesStore.createFile('main.ts', 'main content');
      await gitStore.stageFile('main.ts');
      await gitStore.commit('feat: initial commit');

      // Create new branch
      const createResult = await gitStore.createBranch('feature/test');
      expect(createResult.success).toBe(true);

      // Switch to new branch
      const switchResult = await gitStore.switchBranch('feature/test');
      expect(switchResult.success).toBe(true);
      expect(gitStore.currentBranch).toBe('feature/test');

      // Make changes on new branch
      filesStore.createFile('feature.ts', 'feature content');
      await gitStore.stageFile('feature.ts');
      await gitStore.commit('feat: add feature');

      // Switch back to main
      await gitStore.switchBranch('main');
      expect(gitStore.currentBranch).toBe('main');
    });

    it('should handle merge workflow', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      // Setup branches
      await gitStore.createBranch('feature/merge-test');
      await gitStore.switchBranch('feature/merge-test');

      // Make changes
      const filesStore = useFilesStore.getState();
      filesStore.createFile('merge.ts', 'merge content');
      await gitStore.stageFile('merge.ts');
      await gitStore.commit('feat: add merge file');

      // Switch back and merge
      await gitStore.switchBranch('main');
      const mergeResult = await gitStore.mergeBranch('feature/merge-test');

      expect(mergeResult.success).toBe(true);
    });
  });

  describe('Conflict Resolution Workflow', () => {
    it('should detect merge conflicts', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');

      // Create file on main
      filesStore.createFile('conflict.ts', 'main content');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: add file on main');

      // Create branch and modify same file
      await gitStore.createBranch('feature/conflict');
      await gitStore.switchBranch('feature/conflict');
      filesStore.updateFileContent('conflict.ts', 'feature content');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: modify file on feature');

      // Modify on main as well
      await gitStore.switchBranch('main');
      filesStore.updateFileContent('conflict.ts', 'main modified content');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: modify file on main');

      // Attempt merge - should detect conflict
      const mergeResult = await gitStore.mergeBranch('feature/conflict');

      expect(mergeResult.hasConflicts).toBe(true);
      expect(mergeResult.conflictedFiles).toContain('conflict.ts');
    });

    it('should resolve conflicts and complete merge', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      // Setup conflict (same as above)
      await gitStore.initRepository('/test');
      filesStore.createFile('conflict.ts', 'original');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: initial');

      await gitStore.createBranch('feature/resolve');
      await gitStore.switchBranch('feature/resolve');
      filesStore.updateFileContent('conflict.ts', 'feature version');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: feature change');

      await gitStore.switchBranch('main');
      filesStore.updateFileContent('conflict.ts', 'main version');
      await gitStore.stageFile('conflict.ts');
      await gitStore.commit('feat: main change');

      // Merge with conflicts
      await gitStore.mergeBranch('feature/resolve');

      // Resolve conflict manually
      filesStore.updateFileContent('conflict.ts', 'resolved version');
      await gitStore.stageFile('conflict.ts');

      // Complete merge
      const commitResult = await gitStore.commit('merge: resolve conflicts');
      expect(commitResult.success).toBe(true);
    });
  });

  describe('Stash Workflow', () => {
    it('should stash and apply changes', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');

      // Make initial commit
      filesStore.createFile('stash.ts', 'original');
      await gitStore.stageFile('stash.ts');
      await gitStore.commit('feat: initial');

      // Make changes
      filesStore.updateFileContent('stash.ts', 'modified');

      // Stash changes
      const stashResult = await gitStore.stash('WIP: work in progress');
      expect(stashResult.success).toBe(true);

      // Verify working directory is clean
      const status = await gitStore.getStatus();
      expect(status.modified).toHaveLength(0);

      // Apply stash
      const applyResult = await gitStore.stashApply(0);
      expect(applyResult.success).toBe(true);

      // Verify changes are back
      const finalStatus = await gitStore.getStatus();
      expect(finalStatus.modified).toContain('stash.ts');
    });
  });

  describe('Pull and Sync Workflow', () => {
    it('should handle pull with fast-forward', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.cloneRepository('https://github.com/test/repo.git', '/local');

      // Simulate remote changes
      const pullResult = await gitStore.pull();

      expect(pullResult.success).toBe(true);
      expect(pullResult.type).toBe('fast-forward');
    });

    it('should handle pull with merge', async () => {
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');

      // Make local commit
      filesStore.createFile('local.ts', 'local content');
      await gitStore.stageFile('local.ts');
      await gitStore.commit('feat: local change');

      // Pull with merge
      const pullResult = await gitStore.pull();

      if (!pullResult.success && pullResult.requiresMerge) {
        // Handle merge
        const mergeResult = await gitStore.commit('merge: pull changes');
        expect(mergeResult.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle commit without staged files', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      const commitResult = await gitStore.commit('feat: empty commit');

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toContain('nothing to commit');
    });

    it('should handle push without remote', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      const pushResult = await gitStore.push();

      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toBeDefined();
    });

    it('should handle invalid branch name', async () => {
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      const switchResult = await gitStore.switchBranch('non-existent-branch');

      expect(switchResult.success).toBe(false);
      expect(switchResult.error).toBeDefined();
    });
  });
});
