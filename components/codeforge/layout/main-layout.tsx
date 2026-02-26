'use client';

import { useEffect, useMemo, useRef } from 'react';
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
const AgentPanel = dynamic(() => import('@/components/agent/agent-panel').then(m => ({ default: m.AgentPanel || m.default })), { ssr: false });
const AgentToggleButton = dynamic(() => import('@/components/agent/agent-toggle-button').then(m => ({ default: m.AgentToggleButton || m.default })), { ssr: false });

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

  const { isPanelOpen: isAgentOpen, initialize: initAgent } = useAgentStore();

  const sidebarHandleRef = useRef<HTMLDivElement | null>(null);
  const panelHandleRef = useRef<HTMLDivElement | null>(null);

  // Initialize agent store on mount
  useEffect(() => {
    initAgent();
  }, [initAgent]);

  useEffect(() => {
    const initial = getTheme();
    setTheme(initial);
    applyTheme(initial);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleSidebarResize = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(e.clientX - 48, 600));
      setSidebarWidth(newWidth);
    };

    const handlePanelResize = (e: MouseEvent) => {
      const newHeight = Math.max(
        150,
        Math.min(window.innerHeight - e.clientY, 500)
      );
      setPanelHeight(newHeight);
    };

    const sidebarHandle = sidebarHandleRef.current;
    const panelHandle = panelHandleRef.current;

    const onSidebarMouseDown = () => {
      document.addEventListener('mousemove', handleSidebarResize);
      document.addEventListener(
        'mouseup',
        () => document.removeEventListener('mousemove', handleSidebarResize),
        { once: true }
      );
    };

    const onPanelMouseDown = () => {
      document.addEventListener('mousemove', handlePanelResize);
      document.addEventListener(
        'mouseup',
        () => document.removeEventListener('mousemove', handlePanelResize),
        { once: true }
      );
    };

    sidebarHandle?.addEventListener('mousedown', onSidebarMouseDown);
    panelHandle?.addEventListener('mousedown', onPanelMouseDown);

    return () => {
      sidebarHandle?.removeEventListener('mousedown', onSidebarMouseDown);
      panelHandle?.removeEventListener('mousedown', onPanelMouseDown);
    };
  }, [setSidebarWidth, setPanelHeight]);

  const editorStyle = useMemo(
    () => ({
      width: sidebarVisible ? `calc(100% - ${sidebarWidth}px)` : '100%',
    }),
    [sidebarVisible, sidebarWidth]
  );

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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <ActivityBar />

      {sidebarVisible && (
        <>
          <Sidebar width={sidebarWidth} />
          <div
            ref={sidebarHandleRef}
            className="w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors"
          />
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden" style={editorStyle}>
        <div className="flex-1 overflow-hidden">
          <EditorArea />
        </div>

        {panelVisible && (
          <>
            <div
              ref={panelHandleRef}
              className="h-1 cursor-row-resize bg-border hover:bg-primary/50 transition-colors"
            />
            <Panel height={panelHeight} />
          </>
        )}
      </div>

      <StatusBar />

      {/* Toast notifications — renders in bottom-right corner */}
      <NotificationToast />

      {/* 🤖 AI Agent — Toggle button + sliding panel */}
      <AgentToggleButton />
      {isAgentOpen && <AgentPanel />}
    </div>
  );
}
