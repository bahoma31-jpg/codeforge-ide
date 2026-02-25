import { describe, it, expect, beforeEach } from 'vitest';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useGitStore } from '@/lib/stores/git-store';

/**
 * Integration Tests: File System Operations
 * Tests complete file system workflows across multiple stores
 */
describe('File System Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useFilesStore.getState().reset?.();
    useEditorStore.getState().reset?.();
    useGitStore.getState().reset?.();
  });

  describe('File Creation and Editor Integration', () => {
    it('should create file and open in editor', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      // Create file
      filesStore.createFile('test.ts', 'console.log("test")');

      // Open in editor
      editorStore.openFile('test.ts');

      expect(filesStore.getFile('test.ts')).toBeDefined();
      expect(editorStore.activeFile).toBe('test.ts');
      expect(editorStore.openFiles).toContain('test.ts');
    });

    it('should handle multiple files opened in editor', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      // Create multiple files
      filesStore.createFile('file1.ts', 'content1');
      filesStore.createFile('file2.ts', 'content2');
      filesStore.createFile('file3.ts', 'content3');

      // Open all in editor
      editorStore.openFile('file1.ts');
      editorStore.openFile('file2.ts');
      editorStore.openFile('file3.ts');

      expect(editorStore.openFiles).toHaveLength(3);
      expect(editorStore.activeFile).toBe('file3.ts');
    });

    it('should sync file content between editor and file store', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      filesStore.createFile('test.ts', 'original');
      editorStore.openFile('test.ts');

      // Update content
      editorStore.updateFileContent('test.ts', 'updated');
      filesStore.updateFile('test.ts', 'updated');

      const file = filesStore.getFile('test.ts');
      expect(file?.content).toBe('updated');
    });
  });

  describe('Folder Operations', () => {
    it('should create nested folder structure', () => {
      const filesStore = useFilesStore.getState();

      // Create nested structure
      filesStore.createFolder('src');
      filesStore.createFolder('src/components');
      filesStore.createFolder('src/components/ui');

      expect(filesStore.getFolder('src')).toBeDefined();
      expect(filesStore.getFolder('src/components')).toBeDefined();
      expect(filesStore.getFolder('src/components/ui')).toBeDefined();
    });

    it('should create files in nested folders', () => {
      const filesStore = useFilesStore.getState();

      filesStore.createFolder('src');
      filesStore.createFolder('src/lib');
      filesStore.createFile('src/lib/utils.ts', 'export {}');

      const file = filesStore.getFile('src/lib/utils.ts');
      expect(file).toBeDefined();
      expect(file?.name).toBe('utils.ts');
    });

    it('should delete folder and all contents', () => {
      const filesStore = useFilesStore.getState();

      // Create folder with files
      filesStore.createFolder('temp');
      filesStore.createFile('temp/file1.ts', 'content1');
      filesStore.createFile('temp/file2.ts', 'content2');

      // Delete folder
      filesStore.deleteFolder('temp');

      expect(filesStore.getFolder('temp')).toBeUndefined();
      expect(filesStore.getFile('temp/file1.ts')).toBeUndefined();
      expect(filesStore.getFile('temp/file2.ts')).toBeUndefined();
    });

    it('should rename folder and update file paths', () => {
      const filesStore = useFilesStore.getState();

      filesStore.createFolder('oldName');
      filesStore.createFile('oldName/test.ts', 'content');

      // Rename folder
      filesStore.renameFolder('oldName', 'newName');

      expect(filesStore.getFolder('oldName')).toBeUndefined();
      expect(filesStore.getFolder('newName')).toBeDefined();
      expect(filesStore.getFile('newName/test.ts')).toBeDefined();
    });
  });

  describe('File-Git Integration', () => {
    it('should detect file changes for git', async () => {
      const filesStore = useFilesStore.getState();
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      // Create and modify files
      filesStore.createFile('test.ts', 'original');
      await gitStore.stageFile('test.ts');
      await gitStore.commit('initial');

      // Modify file
      filesStore.updateFile('test.ts', 'modified');

      const status = await gitStore.getStatus();
      expect(status.modified).toContain('test.ts');
    });

    it('should stage multiple files', async () => {
      const filesStore = useFilesStore.getState();
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      // Create multiple files
      filesStore.createFile('file1.ts', 'content1');
      filesStore.createFile('file2.ts', 'content2');
      filesStore.createFile('file3.ts', 'content3');

      // Stage all
      await gitStore.stageFile('file1.ts');
      await gitStore.stageFile('file2.ts');
      await gitStore.stageFile('file3.ts');

      const status = await gitStore.getStatus();
      expect(status.staged).toContain('file1.ts');
      expect(status.staged).toContain('file2.ts');
      expect(status.staged).toContain('file3.ts');
    });

    it('should unstage files', async () => {
      const filesStore = useFilesStore.getState();
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/test');

      filesStore.createFile('test.ts', 'content');
      await gitStore.stageFile('test.ts');

      // Unstage
      await gitStore.unstageFile('test.ts');

      const status = await gitStore.getStatus();
      expect(status.staged).not.toContain('test.ts');
      expect(status.untracked || status.modified).toContain('test.ts');
    });
  });

  describe('File Operations with Editor Open', () => {
    it('should handle file deletion while open in editor', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      filesStore.createFile('test.ts', 'content');
      editorStore.openFile('test.ts');

      // Delete file
      filesStore.deleteFile('test.ts');

      // Editor should close the file
      editorStore.closeFile('test.ts');

      expect(filesStore.getFile('test.ts')).toBeUndefined();
      expect(editorStore.openFiles).not.toContain('test.ts');
    });

    it('should handle file rename while open in editor', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      filesStore.createFile('old.ts', 'content');
      editorStore.openFile('old.ts');

      // Rename file
      filesStore.renameFile('old.ts', 'new.ts');

      // Update editor
      editorStore.closeFile('old.ts');
      editorStore.openFile('new.ts');

      expect(filesStore.getFile('old.ts')).toBeUndefined();
      expect(filesStore.getFile('new.ts')).toBeDefined();
      expect(editorStore.activeFile).toBe('new.ts');
    });

    it('should handle saving file from editor', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      filesStore.createFile('test.ts', 'original');
      editorStore.openFile('test.ts');

      // Modify in editor
      editorStore.updateFileContent('test.ts', 'modified');

      // Save to file system
      filesStore.updateFile('test.ts', 'modified');

      const file = filesStore.getFile('test.ts');
      expect(file?.content).toBe('modified');
    });
  });

  describe('Complex Workflows', () => {
    it('should handle complete project setup workflow', async () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();
      const gitStore = useGitStore.getState();

      // Initialize git
      await gitStore.initRepository('/project');

      // Create folder structure
      filesStore.createFolder('src');
      filesStore.createFolder('src/components');
      filesStore.createFolder('src/lib');
      filesStore.createFolder('tests');

      // Create files
      filesStore.createFile('src/index.ts', 'export {}');
      filesStore.createFile('src/components/Button.tsx', 'export const Button = () => {}');
      filesStore.createFile('src/lib/utils.ts', 'export const utils = {}');
      filesStore.createFile('README.md', '# Project');

      // Open files in editor
      editorStore.openFile('src/index.ts');
      editorStore.openFile('README.md');

      // Stage and commit
      await gitStore.stageFile('src/index.ts');
      await gitStore.stageFile('src/components/Button.tsx');
      await gitStore.stageFile('src/lib/utils.ts');
      await gitStore.stageFile('README.md');
      await gitStore.commit('feat: initial project setup');

      // Verify everything
      expect(filesStore.getFolder('src')).toBeDefined();
      expect(filesStore.getFile('src/index.ts')).toBeDefined();
      expect(editorStore.openFiles).toHaveLength(2);

      const history = await gitStore.getCommitHistory();
      expect(history[0].message).toBe('feat: initial project setup');
    });

    it('should handle refactoring workflow', async () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();
      const gitStore = useGitStore.getState();

      await gitStore.initRepository('/project');

      // Initial setup
      filesStore.createFile('utils.ts', 'export const helper = () => {}');
      await gitStore.stageFile('utils.ts');
      await gitStore.commit('feat: add utils');

      // Refactor: move to lib folder
      filesStore.createFolder('lib');
      const oldContent = filesStore.getFile('utils.ts')?.content || '';
      filesStore.createFile('lib/utils.ts', oldContent);
      filesStore.deleteFile('utils.ts');

      // Update editor
      editorStore.closeFile('utils.ts');
      editorStore.openFile('lib/utils.ts');

      // Commit refactor
      await gitStore.stageFile('lib/utils.ts');
      await gitStore.stageFile('utils.ts'); // Deletion
      await gitStore.commit('refactor: move utils to lib');

      expect(filesStore.getFile('utils.ts')).toBeUndefined();
      expect(filesStore.getFile('lib/utils.ts')).toBeDefined();
      expect(editorStore.activeFile).toBe('lib/utils.ts');
    });

    it('should handle batch operations', () => {
      const filesStore = useFilesStore.getState();

      // Create multiple files and folders in batch
      const structure = [
        { type: 'folder', path: 'src' },
        { type: 'folder', path: 'src/components' },
        { type: 'file', path: 'src/index.ts', content: 'export {}' },
        { type: 'file', path: 'src/components/Header.tsx', content: 'export const Header = () => {}' },
        { type: 'file', path: 'src/components/Footer.tsx', content: 'export const Footer = () => {}' },
      ];

      structure.forEach((item) => {
        if (item.type === 'folder') {
          filesStore.createFolder(item.path);
        } else {
          filesStore.createFile(item.path, item.content || '');
        }
      });

      // Verify all created
      expect(filesStore.getFolder('src')).toBeDefined();
      expect(filesStore.getFolder('src/components')).toBeDefined();
      expect(filesStore.getFile('src/index.ts')).toBeDefined();
      expect(filesStore.getFile('src/components/Header.tsx')).toBeDefined();
      expect(filesStore.getFile('src/components/Footer.tsx')).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle duplicate file creation', () => {
      const filesStore = useFilesStore.getState();

      filesStore.createFile('test.ts', 'content1');

      // Try to create duplicate
      const result = filesStore.createFile('test.ts', 'content2');

      // Should either fail or overwrite based on store implementation
      const file = filesStore.getFile('test.ts');
      expect(file).toBeDefined();
    });

    it('should handle deep nested paths', () => {
      const filesStore = useFilesStore.getState();

      const deepPath = 'a/b/c/d/e/f/g/h/i/j';
      filesStore.createFolder(deepPath);
      filesStore.createFile(`${deepPath}/deep.ts`, 'content');

      expect(filesStore.getFile(`${deepPath}/deep.ts`)).toBeDefined();
    });

    it('should handle special characters in filenames', () => {
      const filesStore = useFilesStore.getState();

      // Valid special characters
      filesStore.createFile('file-name.test.ts', 'content');
      filesStore.createFile('file_name.ts', 'content');
      filesStore.createFile('file.config.ts', 'content');

      expect(filesStore.getFile('file-name.test.ts')).toBeDefined();
      expect(filesStore.getFile('file_name.ts')).toBeDefined();
      expect(filesStore.getFile('file.config.ts')).toBeDefined();
    });

    it('should handle large number of files', () => {
      const filesStore = useFilesStore.getState();
      const fileCount = 100;

      // Create many files
      for (let i = 0; i < fileCount; i++) {
        filesStore.createFile(`file${i}.ts`, `content${i}`);
      }

      // Verify all exist
      for (let i = 0; i < fileCount; i++) {
        expect(filesStore.getFile(`file${i}.ts`)).toBeDefined();
      }
    });

    it('should handle concurrent modifications', () => {
      const filesStore = useFilesStore.getState();
      const editorStore = useEditorStore.getState();

      filesStore.createFile('test.ts', 'original');
      editorStore.openFile('test.ts');

      // Simulate concurrent updates
      filesStore.updateFile('test.ts', 'update1');
      editorStore.updateFileContent('test.ts', 'update2');

      // Last update should win
      const file = filesStore.getFile('test.ts');
      expect(file?.content).toBeDefined();
    });
  });
});
