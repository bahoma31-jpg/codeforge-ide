import { describe, it, expect, beforeEach } from 'vitest';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import { useFilesStore } from '@/lib/stores/files-store';
import { useGitStore } from '@/lib/stores/git-store';

/**
 * Integration Tests: Terminal Operations
 * Tests multi-terminal operations and integration with file/git stores
 */
describe('Terminal Operations Integration', () => {
  beforeEach(() => {
    // Reset stores
    const terminalStore = useTerminalStore.getState();
    terminalStore.terminals.forEach((t) => terminalStore.closeTerminal(t.id));

    useFilesStore.getState().reset?.();
    useGitStore.getState().reset?.();
  });

  describe('Multi-Terminal Operations', () => {
    it('should handle concurrent operations in multiple terminals', () => {
      const { createTerminal, terminals, updateTerminalCwd } = useTerminalStore.getState();

      // Create 3 terminals
      createTerminal();
      createTerminal();
      createTerminal();

      expect(terminals).toHaveLength(3);

      // Each terminal in different directory
      updateTerminalCwd(terminals[0].id, '/project/src');
      updateTerminalCwd(terminals[1].id, '/project/tests');
      updateTerminalCwd(terminals[2].id, '/project/docs');

      expect(terminals[0].cwd).toBe('/project/src');
      expect(terminals[1].cwd).toBe('/project/tests');
      expect(terminals[2].cwd).toBe('/project/docs');
    });

    it('should maintain independent command history per terminal', () => {
      const { createTerminal, terminals, addToHistory } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      // Different commands in each terminal
      addToHistory(terminals[0].id, 'ls -la');
      addToHistory(terminals[0].id, 'cd src');

      addToHistory(terminals[1].id, 'git status');
      addToHistory(terminals[1].id, 'git add .');

      expect(terminals[0].history).toEqual(['ls -la', 'cd src']);
      expect(terminals[1].history).toEqual(['git status', 'git add .']);
    });

    it('should handle switching between terminals while maintaining state', () => {
      const { createTerminal, terminals, setActiveTerminal, updateTerminalCwd } =
        useTerminalStore.getState();

      createTerminal();
      const terminal1Id = terminals[0].id;
      updateTerminalCwd(terminal1Id, '/path1');

      createTerminal();
      const terminal2Id = terminals[1].id;
      updateTerminalCwd(terminal2Id, '/path2');

      // Switch back to first terminal
      setActiveTerminal(terminal1Id);

      const terminal1 = terminals.find((t) => t.id === terminal1Id);
      expect(terminal1?.cwd).toBe('/path1');
      expect(terminal1?.isActive).toBe(true);
    });
  });

  describe('Terminal-File Store Integration', () => {
    it('should create file via terminal and see it in file store', async () => {
      const terminalStore = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();

      terminalStore.createTerminal();

      // Simulate terminal command: touch test.ts
      filesStore.createFile('test.ts', '');

      const file = filesStore.getFile('test.ts');
      expect(file).toBeDefined();
      expect(file?.name).toBe('test.ts');
    });

    it('should delete file via terminal and reflect in file store', async () => {
      const terminalStore = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();

      terminalStore.createTerminal();

      // Create then delete
      filesStore.createFile('temp.ts', 'content');
      expect(filesStore.getFile('temp.ts')).toBeDefined();

      // Simulate terminal command: rm temp.ts
      filesStore.deleteFile('temp.ts');

      expect(filesStore.getFile('temp.ts')).toBeUndefined();
    });

    it('should create directory via terminal', () => {
      const terminalStore = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();

      terminalStore.createTerminal();

      // Simulate: mkdir components
      filesStore.createFolder('components');

      const folder = filesStore.getFolder('components');
      expect(folder).toBeDefined();
      expect(folder?.type).toBe('folder');
    });

    it('should navigate directories and update terminal cwd', () => {
      const { createTerminal, terminals, updateTerminalCwd } = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      // Create nested folders
      filesStore.createFolder('src');
      filesStore.createFolder('src/components');

      // Navigate: cd src
      updateTerminalCwd(terminalId, '/project/src');
      expect(terminals[0].cwd).toBe('/project/src');

      // Navigate: cd components
      updateTerminalCwd(terminalId, '/project/src/components');
      expect(terminals[0].cwd).toBe('/project/src/components');
    });
  });

  describe('Terminal-Git Store Integration', () => {
    it('should execute git status from terminal', async () => {
      const terminalStore = useTerminalStore.getState();
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');
      terminalStore.createTerminal();

      // Simulate: git status
      const status = await gitStore.getStatus();

      expect(status).toBeDefined();
      expect(status.branch).toBeDefined();
    });

    it('should stage files via terminal git command', async () => {
      const terminalStore = useTerminalStore.getState();
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');
      terminalStore.createTerminal();

      // Create file
      filesStore.createFile('test.ts', 'content');

      // Simulate: git add test.ts
      await gitStore.stageFile('test.ts');

      const status = await gitStore.getStatus();
      expect(status.staged).toContain('test.ts');
    });

    it('should commit from terminal', async () => {
      const terminalStore = useTerminalStore.getState();
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');
      terminalStore.createTerminal();

      filesStore.createFile('test.ts', 'content');
      await gitStore.stageFile('test.ts');

      // Simulate: git commit -m "feat: add test"
      const result = await gitStore.commit('feat: add test');

      expect(result.success).toBe(true);
    });

    it('should show git log from terminal', async () => {
      const terminalStore = useTerminalStore.getState();
      const gitStore = useGitStore.getState();
      const filesStore = useFilesStore.getState();

      await gitStore.initRepository('/test');
      terminalStore.createTerminal();

      // Make commits
      filesStore.createFile('file1.ts', 'content1');
      await gitStore.stageFile('file1.ts');
      await gitStore.commit('feat: first commit');

      filesStore.createFile('file2.ts', 'content2');
      await gitStore.stageFile('file2.ts');
      await gitStore.commit('feat: second commit');

      // Simulate: git log
      const history = await gitStore.getCommitHistory();

      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('feat: second commit');
      expect(history[1].message).toBe('feat: first commit');
    });
  });

  describe('Complex Multi-Store Scenarios', () => {
    it('should handle complete workflow across all stores', async () => {
      const terminalStore = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();
      const gitStore = useGitStore.getState();

      // Initialize
      await gitStore.initRepository('/test');
      terminalStore.createTerminal();

      // Create files in different directories
      filesStore.createFolder('src');
      filesStore.createFile('src/index.ts', 'export {}');
      filesStore.createFile('README.md', '# Project');

      // Update terminal cwd
      terminalStore.updateTerminalCwd(terminalStore.terminals[0].id, '/test/src');

      // Stage and commit
      await gitStore.stageFile('src/index.ts');
      await gitStore.stageFile('README.md');
      await gitStore.commit('feat: initial setup');

      // Add to terminal history
      terminalStore.addToHistory(terminalStore.terminals[0].id, 'git add .');
      terminalStore.addToHistory(
        terminalStore.terminals[0].id,
        'git commit -m "feat: initial setup"'
      );

      // Verify all stores are in sync
      expect(filesStore.getFile('src/index.ts')).toBeDefined();
      expect(terminalStore.terminals[0].history).toHaveLength(2);

      const history = await gitStore.getCommitHistory();
      expect(history[0].message).toBe('feat: initial setup');
    });

    it('should handle parallel terminal sessions', () => {
      const terminalStore = useTerminalStore.getState();

      // Create 3 terminals for different tasks
      terminalStore.createTerminal();
      terminalStore.updateTerminalTitle(terminalStore.terminals[0].id, 'Dev Server');

      terminalStore.createTerminal();
      terminalStore.updateTerminalTitle(terminalStore.terminals[1].id, 'Git Operations');

      terminalStore.createTerminal();
      terminalStore.updateTerminalTitle(terminalStore.terminals[2].id, 'Tests');

      // Different commands in each
      terminalStore.addToHistory(terminalStore.terminals[0].id, 'npm run dev');
      terminalStore.addToHistory(terminalStore.terminals[1].id, 'git status');
      terminalStore.addToHistory(terminalStore.terminals[2].id, 'npm test');

      expect(terminalStore.terminals[0].title).toBe('Dev Server');
      expect(terminalStore.terminals[1].title).toBe('Git Operations');
      expect(terminalStore.terminals[2].title).toBe('Tests');

      expect(terminalStore.terminals[0].history[0]).toBe('npm run dev');
      expect(terminalStore.terminals[1].history[0]).toBe('git status');
      expect(terminalStore.terminals[2].history[0]).toBe('npm test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle terminal operations when at max terminal limit', () => {
      const { createTerminal, terminals, maxTerminals } = useTerminalStore.getState();

      // Create max terminals
      for (let i = 0; i < maxTerminals; i++) {
        createTerminal();
      }

      // All terminals should still work independently
      terminals.forEach((terminal, index) => {
        useTerminalStore.getState().updateTerminalCwd(terminal.id, `/path${index}`);
      });

      terminals.forEach((terminal, index) => {
        expect(terminal.cwd).toBe(`/path${index}`);
      });
    });

    it('should handle rapid file operations across terminals', () => {
      const terminalStore = useTerminalStore.getState();
      const filesStore = useFilesStore.getState();

      terminalStore.createTerminal();
      terminalStore.createTerminal();

      // Rapid file creation from different terminals
      for (let i = 0; i < 10; i++) {
        filesStore.createFile(`file${i}.ts`, `content${i}`);
      }

      // All files should exist
      for (let i = 0; i < 10; i++) {
        expect(filesStore.getFile(`file${i}.ts`)).toBeDefined();
      }
    });

    it('should maintain state after terminal close and recreate', () => {
      const terminalStore = useTerminalStore.getState();

      terminalStore.createTerminal();
      const firstId = terminalStore.terminals[0].id;

      terminalStore.addToHistory(firstId, 'command1');
      terminalStore.addToHistory(firstId, 'command2');

      // Close terminal
      terminalStore.closeTerminal(firstId);

      // Create new terminal
      terminalStore.createTerminal();

      // New terminal should have fresh state
      expect(terminalStore.terminals[0].history).toHaveLength(0);
      expect(terminalStore.terminals[0].id).not.toBe(firstId);
    });
  });
});
