import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editor-store';

describe('editor-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { openFiles, setOpenFiles, setActiveFile } = useEditorStore.getState();
    setOpenFiles([]);
    setActiveFile(null);
  });

  describe('openFile', () => {
    it('should add file to openFiles when not already open', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('test.ts', 'const x = 1;');

      expect(openFiles).toHaveLength(1);
      expect(openFiles[0]).toEqual({
        path: 'test.ts',
        content: 'const x = 1;',
      });
    });

    it('should set file as active when opened', () => {
      const { openFile, activeFile } = useEditorStore.getState();

      openFile('test.ts', 'const x = 1;');

      expect(activeFile).toBe('test.ts');
    });

    it('should not duplicate files when opening already open file', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('test.ts', 'const x = 1;');
      openFile('test.ts', 'const x = 2;');

      expect(openFiles).toHaveLength(1);
    });

    it('should update active file when opening duplicate', () => {
      const { openFile, activeFile } = useEditorStore.getState();

      openFile('test.ts', 'const x = 1;');
      openFile('other.ts', 'const y = 2;');
      openFile('test.ts', 'const x = 1;');

      expect(activeFile).toBe('test.ts');
    });

    it('should handle multiple files', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');
      openFile('file3.ts', 'content3');

      expect(openFiles).toHaveLength(3);
      expect(openFiles.map((f) => f.path)).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
    });
  });

  describe('closeFile', () => {
    it('should remove file from openFiles', () => {
      const { openFile, closeFile, openFiles } = useEditorStore.getState();

      openFile('test.ts', 'content');
      closeFile('test.ts');

      expect(openFiles).toHaveLength(0);
    });

    it('should switch to previous file when closing active file', () => {
      const { openFile, closeFile, activeFile } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');
      openFile('file3.ts', 'content3');

      closeFile('file3.ts');

      expect(activeFile).toBe('file2.ts');
    });

    it('should set activeFile to null when closing last file', () => {
      const { openFile, closeFile, activeFile } = useEditorStore.getState();

      openFile('test.ts', 'content');
      closeFile('test.ts');

      expect(activeFile).toBeNull();
    });

    it('should not change activeFile when closing non-active file', () => {
      const { openFile, closeFile, activeFile } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');

      closeFile('file1.ts');

      expect(activeFile).toBe('file2.ts');
    });

    it('should handle closing non-existent file gracefully', () => {
      const { closeFile, openFiles } = useEditorStore.getState();

      closeFile('nonexistent.ts');

      expect(openFiles).toHaveLength(0);
    });
  });

  describe('setActiveFile', () => {
    it('should set active file', () => {
      const { openFile, setActiveFile, activeFile } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');

      setActiveFile('file1.ts');

      expect(activeFile).toBe('file1.ts');
    });

    it('should allow setting active file to null', () => {
      const { openFile, setActiveFile, activeFile } = useEditorStore.getState();

      openFile('test.ts', 'content');
      setActiveFile(null);

      expect(activeFile).toBeNull();
    });

    it('should handle setting active file that is not open', () => {
      const { setActiveFile, activeFile } = useEditorStore.getState();

      setActiveFile('nonexistent.ts');

      expect(activeFile).toBe('nonexistent.ts');
    });
  });

  describe('updateFileContent', () => {
    it('should update content of open file', () => {
      const { openFile, updateFileContent, openFiles } = useEditorStore.getState();

      openFile('test.ts', 'const x = 1;');
      updateFileContent('test.ts', 'const x = 2;');

      expect(openFiles[0].content).toBe('const x = 2;');
    });

    it('should not affect other files', () => {
      const { openFile, updateFileContent, openFiles } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');

      updateFileContent('file1.ts', 'updated');

      expect(openFiles[0].content).toBe('updated');
      expect(openFiles[1].content).toBe('content2');
    });

    it('should handle updating non-existent file gracefully', () => {
      const { updateFileContent, openFiles } = useEditorStore.getState();

      updateFileContent('nonexistent.ts', 'content');

      expect(openFiles).toHaveLength(0);
    });
  });

  describe('setOpenFiles', () => {
    it('should replace all open files', () => {
      const { openFile, setOpenFiles, openFiles } = useEditorStore.getState();

      openFile('file1.ts', 'content1');

      setOpenFiles([
        { path: 'new1.ts', content: 'new content 1' },
        { path: 'new2.ts', content: 'new content 2' },
      ]);

      expect(openFiles).toHaveLength(2);
      expect(openFiles[0].path).toBe('new1.ts');
      expect(openFiles[1].path).toBe('new2.ts');
    });

    it('should clear all files when given empty array', () => {
      const { openFile, setOpenFiles, openFiles } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');

      setOpenFiles([]);

      expect(openFiles).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file paths', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('', 'content');

      expect(openFiles).toHaveLength(1);
      expect(openFiles[0].path).toBe('');
    });

    it('should handle empty content', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('test.ts', '');

      expect(openFiles).toHaveLength(1);
      expect(openFiles[0].content).toBe('');
    });

    it('should maintain file order', () => {
      const { openFile, openFiles } = useEditorStore.getState();

      openFile('a.ts', 'a');
      openFile('b.ts', 'b');
      openFile('c.ts', 'c');

      expect(openFiles.map((f) => f.path)).toEqual(['a.ts', 'b.ts', 'c.ts']);
    });

    it('should handle rapid open/close operations', () => {
      const { openFile, closeFile, openFiles } = useEditorStore.getState();

      openFile('test.ts', 'content');
      closeFile('test.ts');
      openFile('test.ts', 'content');
      closeFile('test.ts');
      openFile('test.ts', 'content');

      expect(openFiles).toHaveLength(1);
    });
  });

  describe('State Transitions', () => {
    it('should transition from empty to single file', () => {
      const { openFile, openFiles, activeFile } = useEditorStore.getState();

      expect(openFiles).toHaveLength(0);
      expect(activeFile).toBeNull();

      openFile('test.ts', 'content');

      expect(openFiles).toHaveLength(1);
      expect(activeFile).toBe('test.ts');
    });

    it('should transition from single file to empty', () => {
      const { openFile, closeFile, openFiles, activeFile } = useEditorStore.getState();

      openFile('test.ts', 'content');
      closeFile('test.ts');

      expect(openFiles).toHaveLength(0);
      expect(activeFile).toBeNull();
    });

    it('should transition between multiple files', () => {
      const { openFile, setActiveFile, activeFile } = useEditorStore.getState();

      openFile('file1.ts', 'content1');
      openFile('file2.ts', 'content2');
      openFile('file3.ts', 'content3');

      expect(activeFile).toBe('file3.ts');

      setActiveFile('file1.ts');
      expect(activeFile).toBe('file1.ts');

      setActiveFile('file2.ts');
      expect(activeFile).toBe('file2.ts');
    });
  });
});
