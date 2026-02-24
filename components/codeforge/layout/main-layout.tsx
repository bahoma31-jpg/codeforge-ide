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
    [sidebarWidth]
  );
  const panelStyle = useMemo(
    () => ({ height: `${panelHeight}px` }),
    [panelHeight]
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
