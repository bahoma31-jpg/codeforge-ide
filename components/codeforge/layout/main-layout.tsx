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
import { NotificationToast } from '../notifications/notification-toast';

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
    </div>
  );
}
