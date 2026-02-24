import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarVisible: true,
      panelVisible: true,
      activityBarView: 'explorer',
      sidebarWidth: 250,
      panelHeight: 200,
      theme: 'dark',
    });
  });

  it('toggles sidebar', () => {
    const { result } = renderHook(() => useUIStore());
    expect(result.current.sidebarVisible).toBe(true);

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarVisible).toBe(false);

    act(() => result.current.toggleSidebar());
    expect(result.current.sidebarVisible).toBe(true);
  });

  it('toggles panel', () => {
    const { result } = renderHook(() => useUIStore());
    expect(result.current.panelVisible).toBe(true);

    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(false);
  });

  it('changes theme', () => {
    const { result } = renderHook(() => useUIStore());
    act(() => result.current.setTheme('light'));
    expect(result.current.theme).toBe('light');

    act(() => result.current.setTheme('high-contrast'));
    expect(result.current.theme).toBe('high-contrast');
  });

  it('changes activity bar view', () => {
    const { result } = renderHook(() => useUIStore());
    act(() => result.current.setActivityBarView('search'));
    expect(result.current.activityBarView).toBe('search');
  });

  it('clamps sidebar width to 200-400', () => {
    const { result } = renderHook(() => useUIStore());
    act(() => result.current.setSidebarWidth(100));
    expect(result.current.sidebarWidth).toBe(200);

    act(() => result.current.setSidebarWidth(999));
    expect(result.current.sidebarWidth).toBe(400);
  });

  it('clamps panel height to 150-400', () => {
    const { result } = renderHook(() => useUIStore());
    act(() => result.current.setPanelHeight(50));
    expect(result.current.panelHeight).toBe(150);

    act(() => result.current.setPanelHeight(800));
    expect(result.current.panelHeight).toBe(400);
  });
});

describe('Editor Store', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  it('adds a tab and sets it active', () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.addTab({
        id: 'test-1',
        filePath: '/test.ts',
        fileName: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabId).toBe('test-1');
  });

  it('does not duplicate tabs with same filePath', () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.addTab({
        id: 'test-1',
        filePath: '/test.ts',
        fileName: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    act(() => {
      result.current.addTab({
        id: 'test-2',
        filePath: '/test.ts',
        fileName: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    expect(result.current.tabs).toHaveLength(1);
  });

  it('closes a tab and selects the next one', () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.addTab({
        id: 'a',
        filePath: '/a.ts',
        fileName: 'a.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    act(() => {
      result.current.addTab({
        id: 'b',
        filePath: '/b.ts',
        fileName: 'b.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    act(() => result.current.closeTab('b'));
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabId).toBe('a');
  });

  it('updates tab content and marks dirty', () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.addTab({
        id: 'c',
        filePath: '/c.txt',
        fileName: 'c.txt',
        language: 'plaintext',
        content: '',
        isDirty: false,
        isActive: true,
      });
    });

    act(() => result.current.updateTabContent('c', 'hello world'));
    expect(result.current.tabs[0]?.content).toBe('hello world');
    expect(result.current.tabs[0]?.isDirty).toBe(true);
  });
});
