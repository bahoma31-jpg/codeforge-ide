'use client';

/**
 * CodeForge IDE — Main Layout v3.0
 * Three-panel layout: [ActivityBar | Sidebar | Editor | AgentPanel]
 * The editor is always in the CENTER between the file tree and chat.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAgentStore } from '@/lib/stores/agent-store';
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
import { NotificationToast } from '../notifications/notification-toast';

// Lazy-load agent components (only loaded when needed)
import dynamic from 'next/dynamic';
const AgentPanel = dynamic(
  () =>
    import('@/components/agent/agent-panel').then((m) => ({
      default: m.AgentPanel || m.default,
    })),
  { ssr: false }
);

export default function MainLayout() {
  useKeyboardShortcuts();

  const {
    sidebarVisible,
    panelVisible,
    sidebarWidth,
    panelHeight,
    agentPanelWidth,
    setSidebarWidth,
    setPanelHeight,
    setAgentPanelWidth,
    theme,
    setTheme,
  } = useUIStore();

  const { isPanelOpen: isAgentOpen, initialize: initAgent } = useAgentStore();

  const sidebarHandleRef = useRef<HTMLDivElement | null>(null);
  const panelHandleRef = useRef<HTMLDivElement | null>(null);
  const agentHandleRef = useRef<HTMLDivElement | null>(null);

  // Initialize agent store on mount
  useEffect(() => {
    initAgent();
  }, [initAgent]);

  // Theme initialization
  useEffect(() => {
    const initial = getTheme();
    setTheme(initial);
    applyTheme(initial);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  // ─── Resize handlers ──────────────────────────────────────

  const setupResize = useCallback(
    (
      ref: React.RefObject<HTMLDivElement | null>,
      onMove: (e: MouseEvent) => void
    ) => {
      const handle = ref.current;
      if (!handle) return;

      const onMouseDown = () => {
        // Prevent text selection during resize
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', onMove);
        document.addEventListener(
          'mouseup',
          () => {
            document.removeEventListener('mousemove', onMove);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          },
          { once: true }
        );
      };

      handle.addEventListener('mousedown', onMouseDown);
      return () => handle.removeEventListener('mousedown', onMouseDown);
    },
    []
  );

  // Sidebar resize
  useEffect(() => {
    return setupResize(sidebarHandleRef, (e: MouseEvent) => {
      // ActivityBar is ~48px wide
      const newWidth = Math.max(200, Math.min(e.clientX - 48, 400));
      setSidebarWidth(newWidth);
    });
  }, [setSidebarWidth, setupResize]);

  // Bottom panel resize
  useEffect(() => {
    const handle = panelHandleRef.current;
    if (!handle) return;

    const onMouseDown = () => {
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      const onMove = (e: MouseEvent) => {
        const newHeight = Math.max(
          150,
          Math.min(window.innerHeight - e.clientY, 400)
        );
        setPanelHeight(newHeight);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener(
        'mouseup',
        () => {
          document.removeEventListener('mousemove', onMove);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        },
        { once: true }
      );
    };

    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [setPanelHeight]);

  // Agent panel resize (drag from LEFT edge of agent panel)
  useEffect(() => {
    return setupResize(agentHandleRef, (e: MouseEvent) => {
      const newWidth = Math.max(
        300,
        Math.min(window.innerWidth - e.clientX, 600)
      );
      setAgentPanelWidth(newWidth);
    });
  }, [setAgentPanelWidth, setupResize]);

  // Keyboard shortcut: Ctrl+Shift+A to toggle agent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        useAgentStore.getState().togglePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* ─── Main Row: ActivityBar + Sidebar + Editor + Agent ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Activity Bar (far left) */}
        <ActivityBar />

        {/* 2. Sidebar (file tree) */}
        {sidebarVisible && (
          <>
            <div style={{ width: sidebarWidth }} className="shrink-0">
              <Sidebar width={sidebarWidth} />
            </div>
            <div
              ref={sidebarHandleRef}
              className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/50 transition-colors"
              title="تغيير حجم الشريط الجانبي"
            />
          </>
        )}

        {/* 3. Editor Area (CENTER — takes remaining space) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EditorArea />
          </div>

          {/* Bottom Panel (Terminal, Problems, etc.) */}
          {panelVisible && (
            <>
              <div
                ref={panelHandleRef}
                className="h-1 shrink-0 cursor-row-resize bg-border hover:bg-primary/50 transition-colors"
                title="تغيير حجم اللوحة السفلية"
              />
              <Panel height={panelHeight} />
            </>
          )}
        </div>

        {/* 4. Agent Chat Panel (RIGHT side) */}
        {isAgentOpen && (
          <>
            <div
              ref={agentHandleRef}
              className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/50 transition-colors"
              title="تغيير حجم لوحة الوكيل"
            />
            <div
              style={{ width: agentPanelWidth }}
              className="shrink-0 overflow-hidden"
            >
              <AgentPanel />
            </div>
          </>
        )}
      </div>

      {/* ─── Status Bar (bottom, full width) ─── */}
      <StatusBar />

      {/* Toast notifications — renders in bottom-right corner */}
      <NotificationToast />
    </div>
  );
}
