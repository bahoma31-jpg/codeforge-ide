# ============================================================
# 🚀 Agent 2: UI Layout Builder — سكريبت التنفيذ الكامل
# شغّله من: C:\Users\Revexn\Desktop\codeforge-ide-main
# ============================================================

cd C:\Users\Revexn\Desktop\codeforge-ide-main

# ── إنشاء المجلدات الناقصة ──
New-Item -ItemType Directory -Force -Path "lib\hooks"
New-Item -ItemType Directory -Force -Path "lib\utils"
New-Item -ItemType Directory -Force -Path "tests\unit"

# ── تثبيت المكتبة المطلوبة ──
pnpm add react-resizable-panels

# ============================================================
# COMMIT 1: Zustand Stores
# ============================================================

# ── 1) lib/stores/ui-store.ts ──
@'
import { create } from 'zustand';

export type ActivityBarView =
  | 'explorer'
  | 'search'
  | 'git'
  | 'extensions'
  | 'settings';

export type CodeforgeTheme = 'light' | 'dark' | 'high-contrast';

interface UIState {
  sidebarVisible: boolean;
  panelVisible: boolean;
  activityBarView: ActivityBarView;
  sidebarWidth: number;
  panelHeight: number;
  theme: CodeforgeTheme;

  toggleSidebar: () => void;
  togglePanel: () => void;
  setActivityBarView: (view: ActivityBarView) => void;
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  setTheme: (theme: CodeforgeTheme) => void;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const useUIStore = create<UIState>((set) => ({
  sidebarVisible: true,
  panelVisible: true,
  activityBarView: 'explorer',
  sidebarWidth: 250,
  panelHeight: 200,
  theme: 'dark',

  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  togglePanel: () => set((s) => ({ panelVisible: !s.panelVisible })),
  setActivityBarView: (view) => set({ activityBarView: view }),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: clamp(Math.round(width), 200, 400) }),
  setPanelHeight: (height) =>
    set({ panelHeight: clamp(Math.round(height), 150, 400) }),
  setTheme: (theme) => set({ theme }),
}));
'@ | Set-Content -Path "lib\stores\ui-store.ts" -Encoding UTF8

# ── 2) lib/stores/editor-store.ts ──
@'
import { create } from 'zustand';

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  addTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.filePath === tab.filePath);
      if (exists) {
        return { activeTabId: exists.id };
      }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id };
    }),

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? newTabs[0]?.id ?? null
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t,
      ),
    })),
}));
'@ | Set-Content -Path "lib\stores\editor-store.ts" -Encoding UTF8

git add lib/stores/ui-store.ts lib/stores/editor-store.ts
git commit -m "feat(ui): implement Zustand stores for UI and Editor state"

# ============================================================
# COMMIT 2: Theme Utility + Keyboard Shortcuts
# ============================================================

# ── 3) lib/utils/theme.ts ──
@'
import type { CodeforgeTheme } from '@/lib/stores/ui-store';

const KEY = 'codeforge-theme';

export function getTheme(): CodeforgeTheme {
  if (typeof window === 'undefined') return 'dark';
  const raw = window.localStorage.getItem(KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'high-contrast') return raw;
  return 'dark';
}

export function applyTheme(theme: CodeforgeTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: CodeforgeTheme) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(current: CodeforgeTheme): CodeforgeTheme {
  return current === 'light' ? 'dark' : 'light';
}
'@ | Set-Content -Path "lib\utils\theme.ts" -Encoding UTF8

# ── 4) lib/hooks/useKeyboardShortcuts.ts ──
@'
import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { setTheme, toggleTheme } from '@/lib/utils/theme';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const {
    toggleSidebar,
    togglePanel,
    theme,
    setTheme: setThemeInStore,
  } = useUIStore();
  const { activeTabId, closeTab } = useEditorStore();

  const chordRef = useRef<{ armed: boolean; ts: number }>({
    armed: false,
    ts: 0,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /mac/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (key === 'j') {
        e.preventDefault();
        togglePanel();
        return;
      }

      if (key === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      if (key === 'k') {
        e.preventDefault();
        chordRef.current = { armed: true, ts: Date.now() };
        return;
      }

      if (key === 't') {
        const { armed, ts } = chordRef.current;
        if (armed && Date.now() - ts <= 1000) {
          e.preventDefault();
          const next = toggleTheme(theme);
          setTheme(next);
          setThemeInStore(next);
        }
        chordRef.current = { armed: false, ts: 0 };
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar, togglePanel, closeTab, activeTabId, theme, setThemeInStore]);
}
'@ | Set-Content -Path "lib\hooks\useKeyboardShortcuts.ts" -Encoding UTF8

git add lib/utils/theme.ts lib/hooks/useKeyboardShortcuts.ts
git commit -m "feat(ui): add theme utility and keyboard shortcuts hook"

# ============================================================
# COMMIT 3: MainLayout + ActivityBar
# ============================================================

# ── 5) components/codeforge/layout/main-layout.tsx ──
@'
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import {
  applyTheme,
  getTheme,
  setTheme as persistTheme,
} from '@/lib/utils/theme';

import ActivityBar from './activity-bar';
import Sidebar from './sidebar';
import EditorArea from './editor-area';
import Panel from './panel';
import StatusBar from './status-bar';

export default function MainLayout() {
  useKeyboardShortcuts();

  const {
    sidebarVisible,
    panelVisible,
    sidebarWidth,
    panelHeight,
    setSidebarWidth,
    setPanelHeight,
    theme,
    setTheme,
  } = useUIStore();

  const sidebarHandleRef = useRef<HTMLDivElement | null>(null);
  const panelHandleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initial = getTheme();
    setTheme(initial);
    applyTheme(initial);
  }, [setTheme]);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const sidebarStyle = useMemo(
    () => ({ width: `${sidebarWidth}px` }),
    [sidebarWidth],
  );
  const panelStyle = useMemo(
    () => ({ height: `${panelHeight}px` }),
    [panelHeight],
  );

  useEffect(() => {
    const handle = sidebarHandleRef.current;
    if (!handle) return;

    let startX = 0;
    let startWidth = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startWidth = sidebarWidth;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (document.body.style.cursor !== 'col-resize') return;
      const dx = e.clientX - startX;
      setSidebarWidth(startWidth + dx);
    };

    const onPointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    handle.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [sidebarWidth, setSidebarWidth]);

  useEffect(() => {
    const handle = panelHandleRef.current;
    if (!handle) return;

    let startY = 0;
    let startHeight = 0;

    const onPointerDown = (e: PointerEvent) => {
      startY = e.clientY;
      startHeight = panelHeight;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (document.body.style.cursor !== 'row-resize') return;
      const dy = startY - e.clientY;
      setPanelHeight(startHeight + dy);
    };

    const onPointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    handle.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [panelHeight, setPanelHeight]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />

        {sidebarVisible && (
          <>
            <div style={sidebarStyle} className="shrink-0 overflow-hidden">
              <Sidebar width={sidebarWidth} />
            </div>
            <div
              ref={sidebarHandleRef}
              className="w-1 shrink-0 cursor-col-resize bg-border/60 hover:bg-border"
              aria-label="Resize sidebar"
              role="separator"
            />
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorArea />

          {panelVisible && (
            <>
              <div
                ref={panelHandleRef}
                className="h-1 cursor-row-resize bg-border/60 hover:bg-border"
                aria-label="Resize panel"
                role="separator"
              />
              <div style={panelStyle} className="shrink-0 overflow-hidden">
                <Panel height={panelHeight} />
              </div>
            </>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\main-layout.tsx" -Encoding UTF8

# ── 6) components/codeforge/layout/activity-bar.tsx ──
@'
'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { Files, Search, GitBranch, Package, Settings } from 'lucide-react';

const views = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export default function ActivityBar() {
  const {
    activityBarView,
    setActivityBarView,
    sidebarVisible,
    toggleSidebar,
  } = useUIStore();

  const onClick = (id: (typeof views)[number]['id']) => {
    if (activityBarView === id) {
      toggleSidebar();
      return;
    }
    if (!sidebarVisible) toggleSidebar();
    setActivityBarView(id);
  };

  return (
    <aside className="flex w-12 flex-col items-center gap-2 border-r border-border bg-[hsl(var(--cf-activitybar))] py-3">
      {views.map((view) => {
        const ActiveIcon = view.icon;
        const active = activityBarView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onClick(view.id)}
            className={[
              'rounded p-2 transition-colors',
              'hover:bg-secondary',
              active
                ? 'bg-secondary text-primary'
                : 'text-muted-foreground',
            ].join(' ')}
            title={view.label}
            aria-pressed={active}
          >
            <ActiveIcon className="h-6 w-6" />
          </button>
        );
      })}
    </aside>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\activity-bar.tsx" -Encoding UTF8

git add components/codeforge/layout/main-layout.tsx components/codeforge/layout/activity-bar.tsx
git commit -m "feat(ui): build MainLayout and ActivityBar components"

# ============================================================
# COMMIT 4: Sidebar
# ============================================================

# ── 7) components/codeforge/layout/sidebar.tsx (جديد) ──
@'
'use client';

import { useMemo } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { ChevronRight, File, Folder } from 'lucide-react';

type SidebarProps = { width: number };

const explorerNodes = [
  {
    type: 'folder' as const,
    name: 'src',
    children: ['index.ts', 'app.tsx', 'styles.css'],
  },
  {
    type: 'folder' as const,
    name: 'public',
    children: ['favicon.ico'],
  },
  { type: 'file' as const, name: 'README.md' },
];

export default function Sidebar({ width }: SidebarProps) {
  const { activityBarView } = useUIStore();
  const { addTab } = useEditorStore();

  const title = useMemo(() => {
    switch (activityBarView) {
      case 'explorer':
        return 'Explorer';
      case 'search':
        return 'Search';
      case 'git':
        return 'Source Control';
      case 'extensions':
        return 'Extensions';
      case 'settings':
        return 'Settings';
      default:
        return 'Explorer';
    }
  }, [activityBarView]);

  const openFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() ?? filePath;
    addTab({
      id: `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      filePath,
      fileName,
      language: fileName.endsWith('.ts')
        ? 'typescript'
        : fileName.endsWith('.tsx')
          ? 'typescriptreact'
          : fileName.endsWith('.css')
            ? 'css'
            : 'plaintext',
      content: '',
      isDirty: false,
      isActive: true,
    });
  };

  return (
    <aside
      style={{ width }}
      className="flex h-full flex-col border-r border-border bg-[hsl(var(--cf-sidebar))]"
    >
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activityBarView === 'explorer' && (
          <div className="space-y-2">
            {explorerNodes.map((node) => {
              if (node.type === 'file') {
                return (
                  <button
                    key={node.name}
                    onClick={() => openFile(`/${node.name}`)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-secondary"
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span>{node.name}</span>
                  </button>
                );
              }

              return (
                <div key={node.name} className="space-y-1">
                  <div className="flex items-center gap-2 rounded px-2 py-1 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                    <Folder className="h-4 w-4" />
                    <span>{node.name}/</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {node.children.map((child) => (
                      <button
                        key={child}
                        onClick={() =>
                          openFile(`/${node.name}/${child}`)
                        }
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-secondary"
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span>{child}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activityBarView === 'search' && (
          <p className="text-sm text-muted-foreground">
            Search UI will be implemented later.
          </p>
        )}

        {activityBarView === 'git' && (
          <p className="text-sm text-muted-foreground">
            Source Control placeholder (Agent 5 scope).
          </p>
        )}

        {activityBarView === 'extensions' && (
          <p className="text-sm text-muted-foreground">
            Extensions view placeholder.
          </p>
        )}

        {activityBarView === 'settings' && (
          <p className="text-sm text-muted-foreground">
            Settings view placeholder.
          </p>
        )}
      </div>
    </aside>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\sidebar.tsx" -Encoding UTF8

git add components/codeforge/layout/sidebar.tsx
git commit -m "feat(ui): implement Sidebar with multi-view support"

# ============================================================
# COMMIT 5: EditorArea + TabBar
# ============================================================

# ── 8) components/codeforge/editor/tab-bar.tsx ──
@'
'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import { Plus, X } from 'lucide-react';

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } =
    useEditorStore();

  const handleAddTab = () => {
    const id = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    addTab({
      id,
      filePath: '/untitled.txt',
      fileName: 'Untitled',
      language: 'plaintext',
      content: '',
      isDirty: false,
      isActive: true,
    });
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-[hsl(var(--cf-editor))] px-2">
      <div className="flex min-w-0 flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'group flex shrink-0 items-center gap-2 border-r border-border px-3 py-2 text-sm',
                'hover:bg-secondary',
                active
                  ? 'bg-secondary font-medium text-primary'
                  : 'text-muted-foreground',
              ].join(' ')}
              title={tab.filePath}
            >
              <span className="max-w-[160px] truncate">
                {tab.fileName}
              </span>
              {tab.isDirty && (
                <span className="text-xs">&#9679;</span>
              )}
              <span
                className="ml-1 inline-flex opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                role="button"
                aria-label={`Close ${tab.fileName}`}
              >
                <X className="h-4 w-4 hover:text-destructive" />
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleAddTab}
        className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="New File"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
'@ | Set-Content -Path "components\codeforge\editor\tab-bar.tsx" -Encoding UTF8

# ── 9) components/codeforge/layout/editor-area.tsx ──
@'
'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import TabBar from '@/components/codeforge/editor/tab-bar';

export default function EditorArea() {
  const { tabs, activeTabId } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--cf-editor))]">
      <TabBar />

      <div className="flex min-h-0 flex-1 p-4">
        {activeTab ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 p-8">
            <p className="text-center text-muted-foreground">
              Monaco Editor will be integrated here by Agent 3.
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Current file:{' '}
              <code className="rounded bg-secondary px-1">
                {activeTab.filePath}
              </code>
            </p>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>
              No files open. Click the + button to create a new file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\editor-area.tsx" -Encoding UTF8

git add components/codeforge/layout/editor-area.tsx components/codeforge/editor/tab-bar.tsx
git commit -m "feat(ui): build EditorArea with tab management"

# ============================================================
# COMMIT 6: Panel + StatusBar
# ============================================================

# ── 10) components/codeforge/layout/panel.tsx ──
@'
'use client';

import { useState } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { AlertCircle, Bug, FileText, Terminal, X } from 'lucide-react';

const sections = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'output', icon: FileText, label: 'Output' },
  { id: 'problems', icon: AlertCircle, label: 'Problems' },
  { id: 'debug', icon: Bug, label: 'Debug Console' },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function Panel({ height }: { height: number }) {
  const [active, setActive] = useState<SectionId>('terminal');
  const { togglePanel } = useUIStore();

  return (
    <div
      style={{ height }}
      className="flex h-full flex-col border-t border-border bg-[hsl(var(--cf-panel))]"
    >
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={[
                  'flex items-center gap-2 border-r border-border px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-secondary',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={togglePanel}
          className="p-2 text-muted-foreground hover:text-foreground"
          title="Close Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {active === 'terminal' && (
          <div className="rounded border-2 border-dashed border-muted-foreground/30 p-4">
            <p className="text-sm text-muted-foreground">
              xterm.js Terminal will be integrated here by Agent 6.
            </p>
          </div>
        )}

        {active === 'output' && (
          <p className="text-sm text-muted-foreground">
            Output logs will appear here...
          </p>
        )}

        {active === 'problems' && (
          <p className="text-sm text-muted-foreground">
            Problems will appear here...
          </p>
        )}

        {active === 'debug' && (
          <p className="text-sm text-muted-foreground">
            Debug Console will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\panel.tsx" -Encoding UTF8

# ── 11) components/codeforge/layout/status-bar.tsx ──
@'
'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import {
  setTheme as persistTheme,
  toggleTheme,
} from '@/lib/utils/theme';
import { GitBranch, Moon, Sun } from 'lucide-react';

export default function StatusBar() {
  const { theme, setTheme } = useUIStore();

  const onToggleTheme = () => {
    const next = toggleTheme(theme);
    setTheme(next);
    persistTheme(next);
  };

  return (
    <footer className="flex h-[22px] items-center justify-between border-t border-border bg-[hsl(var(--cf-statusbar))] px-3 text-xs text-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>
        <span>UTF-8</span>
        <span>Ln 1, Col 1</span>
      </div>

      <div className="flex items-center gap-4">
        <span>TypeScript</span>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1 hover:opacity-80"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-3 w-3" />
          ) : (
            <Sun className="h-3 w-3" />
          )}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </footer>
  );
}
'@ | Set-Content -Path "components\codeforge\layout\status-bar.tsx" -Encoding UTF8

git add components/codeforge/layout/panel.tsx components/codeforge/layout/status-bar.tsx
git commit -m "feat(ui): implement Panel and StatusBar"

# ============================================================
# COMMIT 7: Update page.tsx
# ============================================================

# ── 12) app/page.tsx ──
@'
import MainLayout from '@/components/codeforge/layout/main-layout';

export default function Home() {
  return <MainLayout />;
}
'@ | Set-Content -Path "app\page.tsx" -Encoding UTF8

git add app/page.tsx
git commit -m "feat(ui): integrate MainLayout into app"

# ============================================================
# COMMIT 8: Unit Tests
# ============================================================

# ── 13) tests/unit/layout.test.tsx ──
@'
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
'@ | Set-Content -Path "tests\unit\layout.test.tsx" -Encoding UTF8

git add tests/unit/layout.test.tsx
git commit -m "test(ui): add unit tests for stores and layout"

# ============================================================
# ✅ التحقق النهائي + Push
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All 8 commits created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run these checks:" -ForegroundColor Yellow
Write-Host "  pnpm lint"
Write-Host "  pnpm test"
Write-Host "  pnpm dev"
Write-Host ""
Write-Host "Then push:" -ForegroundColor Yellow
Write-Host "  git push origin main"
Write-Host ""
