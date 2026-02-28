/**
 * اختبارات وحدة لـ Files Store
 * يغطي: الحالة الأولية، UI Actions (setActiveFile, toggleFolder, etc.)، Helper functions
 *
 * ملاحظة: الدوال التي تعتمد على IndexedDB (createFile, readFile, etc.)
 * لا تُختبر هنا لأنها تحتاج mock كامل لـ IndexedDB.
 * نركز على الـ state management و UI actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useFilesStore,
  getNodeById,
  getChildrenFromState,
  isFolderExpanded,
} from '../files-store';

// ─── Helpers ──────────────────────────────────────────────────

function resetStore() {
  useFilesStore.setState({
    nodes: [],
    rootNodes: [],
    activeFileId: null,
    selectedFileId: null,
    expandedFolders: new Set<string>(),
    isLoading: false,
    error: null,
    isInitialized: false,
  });
}

/**
 * بيانات وهمية للاختبار — تمثل شجرة ملفات بسيطة
 */
const mockNodes = [
  {
    id: 'folder-1',
    name: 'src',
    type: 'directory' as const,
    parentId: null,
    content: '',
    language: '',
    path: '/src',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'file-1',
    name: 'index.ts',
    type: 'file' as const,
    parentId: 'folder-1',
    content: 'console.log("hello")',
    language: 'typescript',
    path: '/src/index.ts',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'file-2',
    name: 'app.tsx',
    type: 'file' as const,
    parentId: 'folder-1',
    content: '<App />',
    language: 'typescriptreact',
    path: '/src/app.tsx',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'file-3',
    name: 'README.md',
    type: 'file' as const,
    parentId: null,
    content: '# Hello',
    language: 'markdown',
    path: '/README.md',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ─── Tests ────────────────────────────────────────────────────

describe('FilesStore', () => {
  beforeEach(() => resetStore());

  // ── الحالة الأولية ──

  describe('Initial State', () => {
    it('should start with empty nodes', () => {
      expect(useFilesStore.getState().nodes).toHaveLength(0);
    });

    it('should not be loading initially', () => {
      expect(useFilesStore.getState().isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      expect(useFilesStore.getState().error).toBeNull();
    });

    it('should have no active file initially', () => {
      expect(useFilesStore.getState().activeFileId).toBeNull();
    });

    it('should have no selected file initially', () => {
      expect(useFilesStore.getState().selectedFileId).toBeNull();
    });

    it('should have empty expanded folders set', () => {
      expect(useFilesStore.getState().expandedFolders.size).toBe(0);
    });

    it('should not be initialized initially', () => {
      expect(useFilesStore.getState().isInitialized).toBe(false);
    });
  });

  // ── setActiveFile ──

  describe('setActiveFile', () => {
    it('should set active file ID', () => {
      useFilesStore.getState().setActiveFile('file-1');
      expect(useFilesStore.getState().activeFileId).toBe('file-1');
    });

    it('should accept null to deselect', () => {
      useFilesStore.getState().setActiveFile('file-1');
      useFilesStore.getState().setActiveFile(null);
      expect(useFilesStore.getState().activeFileId).toBeNull();
    });
  });

  // ── setSelectedFile ──

  describe('setSelectedFile', () => {
    it('should set selected file ID', () => {
      useFilesStore.getState().setSelectedFile('file-2');
      expect(useFilesStore.getState().selectedFileId).toBe('file-2');
    });
  });

  // ── toggleFolder ──

  describe('toggleFolder', () => {
    it('should expand a collapsed folder', () => {
      useFilesStore.getState().toggleFolder('folder-1');
      expect(useFilesStore.getState().expandedFolders.has('folder-1')).toBe(
        true
      );
    });

    it('should collapse an expanded folder', () => {
      useFilesStore.getState().toggleFolder('folder-1');
      useFilesStore.getState().toggleFolder('folder-1');
      expect(useFilesStore.getState().expandedFolders.has('folder-1')).toBe(
        false
      );
    });

    it('should not affect other folders', () => {
      useFilesStore.getState().toggleFolder('folder-1');
      useFilesStore.getState().toggleFolder('folder-2');

      const expanded = useFilesStore.getState().expandedFolders;
      expect(expanded.has('folder-1')).toBe(true);
      expect(expanded.has('folder-2')).toBe(true);
    });
  });

  // ── expandFolder ──

  describe('expandFolder', () => {
    it('should add folder to expanded set', () => {
      useFilesStore.getState().expandFolder('folder-1');
      expect(useFilesStore.getState().expandedFolders.has('folder-1')).toBe(
        true
      );
    });

    it('should be idempotent (adding same folder twice)', () => {
      useFilesStore.getState().expandFolder('folder-1');
      useFilesStore.getState().expandFolder('folder-1');
      expect(useFilesStore.getState().expandedFolders.size).toBe(1);
    });
  });

  // ── collapseFolder ──

  describe('collapseFolder', () => {
    it('should remove folder from expanded set', () => {
      useFilesStore.getState().expandFolder('folder-1');
      useFilesStore.getState().collapseFolder('folder-1');
      expect(useFilesStore.getState().expandedFolders.has('folder-1')).toBe(
        false
      );
    });

    it('should not throw when collapsing non-expanded folder', () => {
      expect(() => {
        useFilesStore.getState().collapseFolder('non-existent');
      }).not.toThrow();
    });
  });

  // ── clearError ──

  describe('clearError', () => {
    it('should set error to null', () => {
      useFilesStore.setState({ error: 'حدث خطأ' });
      useFilesStore.getState().clearError();
      expect(useFilesStore.getState().error).toBeNull();
    });
  });

  // ── Helper Functions ──

  describe('Helper Functions', () => {
    beforeEach(() => {
      useFilesStore.setState({ nodes: mockNodes });
    });

    describe('getNodeById', () => {
      it('should return the correct node by ID', () => {
        const node = getNodeById('file-1');
        expect(node).toBeDefined();
        expect(node?.name).toBe('index.ts');
      });

      it('should return undefined for non-existent ID', () => {
        const node = getNodeById('non-existent');
        expect(node).toBeUndefined();
      });
    });

    describe('getChildrenFromState', () => {
      it('should return children of a folder', () => {
        const children = getChildrenFromState('folder-1');
        expect(children).toHaveLength(2);
        expect(children.map((c) => c.name)).toContain('index.ts');
        expect(children.map((c) => c.name)).toContain('app.tsx');
      });

      it('should return root nodes when parentId is null', () => {
        const roots = getChildrenFromState(null);
        expect(roots).toHaveLength(2); // src folder + README.md
      });

      it('should return empty array for folder with no children', () => {
        const children = getChildrenFromState('file-1'); // file, not folder
        expect(children).toHaveLength(0);
      });
    });

    describe('isFolderExpanded', () => {
      it('should return true for expanded folder', () => {
        useFilesStore.getState().expandFolder('folder-1');
        expect(isFolderExpanded('folder-1')).toBe(true);
      });

      it('should return false for collapsed folder', () => {
        expect(isFolderExpanded('folder-1')).toBe(false);
      });
    });
  });
});
