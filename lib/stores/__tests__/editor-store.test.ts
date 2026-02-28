/**
 * اختبارات وحدة لـ Editor Store
 * يغطي: الحالة الأولية، إدارة التبويبات، فتح/إغلاق الملفات
 *
 * ملاحظة: الدوال التي تعتمد على GitHub API (loadRepoTree, openRepoFile, etc.)
 * لا تُختبر هنا لأنها تحتاج mock للـ fetch + auth-store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock auth-store dependency
vi.mock('./auth-store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ token: null }),
  },
}));

// Mock file-path-detect
vi.mock('@/lib/utils/file-path-detect', () => ({
  getLanguageFromExtension: vi.fn().mockReturnValue('typescript'),
  getExtension: vi.fn().mockReturnValue('ts'),
  getFileName: vi.fn().mockReturnValue('test.ts'),
}));

import { useEditorStore } from '../editor-store';

// ─── Helpers ──────────────────────────────────────────────────

function resetStore() {
  useEditorStore.setState({
    tabs: [],
    activeTabId: null,
    currentRepo: null,
    repoTree: [],
    repoTreeLoading: false,
  });
}

function createMockTab(
  overrides: Partial<{
    id: string;
    filePath: string;
    fileName: string;
    language: string;
    content: string;
    isDirty: boolean;
    isActive: boolean;
  }> = {}
) {
  return {
    id: overrides.id ?? 'tab-1',
    filePath: overrides.filePath ?? 'src/index.ts',
    fileName: overrides.fileName ?? 'index.ts',
    language: overrides.language ?? 'typescript',
    content: overrides.content ?? 'console.log("hello");',
    isDirty: overrides.isDirty ?? false,
    isActive: overrides.isActive ?? true,
  };
}

// ─── Tests ────────────────────────────────────────────────────

describe('EditorStore', () => {
  beforeEach(() => resetStore());

  // ── الحالة الأولية ──

  describe('Initial State', () => {
    it('should start with empty tabs', () => {
      expect(useEditorStore.getState().tabs).toHaveLength(0);
    });

    it('should have no active tab initially', () => {
      expect(useEditorStore.getState().activeTabId).toBeNull();
    });

    it('should have no current repo initially', () => {
      expect(useEditorStore.getState().currentRepo).toBeNull();
    });

    it('should not be loading repo tree initially', () => {
      expect(useEditorStore.getState().repoTreeLoading).toBe(false);
    });
  });

  // ── addTab ──

  describe('addTab', () => {
    it('should add a new tab', () => {
      const tab = createMockTab();
      useEditorStore.getState().addTab(tab);

      const state = useEditorStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].fileName).toBe('index.ts');
    });

    it('should set activeTabId to the new tab', () => {
      const tab = createMockTab();
      useEditorStore.getState().addTab(tab);

      expect(useEditorStore.getState().activeTabId).toBe('tab-1');
    });

    it('should not duplicate tab for same filePath', () => {
      const tab = createMockTab();
      useEditorStore.getState().addTab(tab);
      useEditorStore.getState().addTab({ ...tab, id: 'tab-2' });

      // يجب أن يبقى tab واحد فقط
      expect(useEditorStore.getState().tabs).toHaveLength(1);
    });

    it('should activate existing tab when opening same file', () => {
      const tab = createMockTab();
      useEditorStore.getState().addTab(tab);

      // إضافة tab آخر
      useEditorStore.getState().addTab(
        createMockTab({
          id: 'tab-2',
          filePath: 'src/app.ts',
          fileName: 'app.ts',
        })
      );

      // إعادة فتح الأول
      useEditorStore.getState().addTab({ ...tab, id: 'tab-3' });

      expect(useEditorStore.getState().activeTabId).toBe('tab-1');
    });
  });

  // ── closeTab ──

  describe('closeTab', () => {
    it('should remove a tab by ID', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-2', filePath: 'src/app.ts' }));

      useEditorStore.getState().closeTab('tab-1');

      expect(useEditorStore.getState().tabs).toHaveLength(1);
      expect(useEditorStore.getState().tabs[0].id).toBe('tab-2');
    });

    it('should activate next tab when closing active tab', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-2', filePath: 'src/app.ts' }));

      // الـ active tab هو tab-2 (آخر مضاف)
      useEditorStore.getState().closeTab('tab-2');

      // يجب أن ينتقل للـ tab الباقي
      expect(useEditorStore.getState().activeTabId).toBe('tab-1');
    });

    it('should set activeTabId to null when closing last tab', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore.getState().closeTab('tab-1');

      expect(useEditorStore.getState().activeTabId).toBeNull();
      expect(useEditorStore.getState().tabs).toHaveLength(0);
    });

    it('should keep activeTabId unchanged when closing non-active tab', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-2', filePath: 'src/app.ts' }));

      // الـ active هو tab-2
      useEditorStore.getState().closeTab('tab-1');

      expect(useEditorStore.getState().activeTabId).toBe('tab-2');
    });
  });

  // ── setActiveTab ──

  describe('setActiveTab', () => {
    it('should change active tab ID', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-2', filePath: 'src/app.ts' }));

      useEditorStore.getState().setActiveTab('tab-1');
      expect(useEditorStore.getState().activeTabId).toBe('tab-1');
    });
  });

  // ── updateTabContent ──

  describe('updateTabContent', () => {
    it('should update content of specified tab', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore.getState().updateTabContent('tab-1', 'new content');

      const tab = useEditorStore.getState().tabs.find((t) => t.id === 'tab-1');
      expect(tab?.content).toBe('new content');
    });

    it('should mark tab as dirty after content change', () => {
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-1', isDirty: false }));
      useEditorStore.getState().updateTabContent('tab-1', 'modified');

      const tab = useEditorStore.getState().tabs.find((t) => t.id === 'tab-1');
      expect(tab?.isDirty).toBe(true);
    });

    it('should not affect other tabs', () => {
      useEditorStore.getState().addTab(createMockTab({ id: 'tab-1' }));
      useEditorStore
        .getState()
        .addTab(createMockTab({ id: 'tab-2', filePath: 'src/app.ts' }));

      useEditorStore.getState().updateTabContent('tab-1', 'changed');

      const tab2 = useEditorStore.getState().tabs.find((t) => t.id === 'tab-2');
      expect(tab2?.isDirty).toBe(false);
    });
  });

  // ── openFile ──

  describe('openFile', () => {
    it('should create tab from file object and activate it', () => {
      useEditorStore.getState().openFile({
        id: 'file-1',
        name: 'component.tsx',
        content: '<div>Hello</div>',
        language: 'typescriptreact',
        path: 'src/component.tsx',
      });

      const state = useEditorStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe('file-1');
      expect(state.tabs[0].fileName).toBe('component.tsx');
      expect(state.tabs[0].content).toBe('<div>Hello</div>');
    });

    it('should not duplicate tab when opening same file ID', () => {
      const file = {
        id: 'file-1',
        name: 'index.ts',
        content: 'content',
        path: 'src/index.ts',
      };

      useEditorStore.getState().openFile(file);
      useEditorStore.getState().openFile(file);

      expect(useEditorStore.getState().tabs).toHaveLength(1);
    });

    it('should default language to plaintext if not specified', () => {
      useEditorStore.getState().openFile({
        id: 'file-1',
        name: 'readme.txt',
        content: 'Hello',
        path: 'readme.txt',
      });

      expect(useEditorStore.getState().tabs[0].language).toBe('plaintext');
    });
  });
});
