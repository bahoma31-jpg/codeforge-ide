'use client';

/**
 * CodeForge IDE — Editor Tabs
 * Tab bar for open files in the editor.
 *
 * Connects directly to editor-store (no prop drilling).
 * Uses <div role="tab"> + <button> for close — valid HTML.
 * Replaces the old tab-bar.tsx which had <button> inside <button>.
 */

import { useEditorStore } from '@/lib/stores/editor-store';
import { X, Plus, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EditorTabs() {
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

  /**
   * Handle middle-click to close tab (standard IDE behavior)
   */
  const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  /**
   * Handle keyboard navigation within tabs
   */
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setActiveTab(tabId);
        break;
      case 'Delete':
        e.preventDefault();
        closeTab(tabId);
        break;
      default:
        break;
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center border-b border-border bg-[hsl(var(--cf-editor))]">
      {/* Tabs row */}
      <div
        role="tablist"
        aria-label="الملفات المفتوحة"
        className="flex min-w-0 flex-1 items-center overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`editor-panel-${tab.id}`}
              aria-label={`${tab.fileName}${tab.isDirty ? ' (معدّل)' : ''}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={cn(
                'group relative flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-1.5 cursor-pointer',
                'transition-colors duration-100 select-none',
                'hover:bg-accent/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isActive
                  ? 'bg-[hsl(var(--cf-editor))] text-foreground'
                  : 'bg-muted/30 text-muted-foreground'
              )}
            >
              {/* Active indicator — bottom bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}

              {/* File icon */}
              <FileCode2
                className="h-3.5 w-3.5 shrink-0 opacity-60"
                aria-hidden="true"
              />

              {/* File name */}
              <span className="max-w-[140px] truncate text-xs">
                {tab.fileName}
              </span>

              {/* Dirty indicator */}
              {tab.isDirty && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#f9e2af]"
                  aria-label="معدّل"
                  title="تغييرات غير محفوظة"
                />
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }
                }}
                aria-label={`إغلاق ${tab.fileName}`}
                aria-keyshortcuts="Ctrl+W"
                tabIndex={-1}
                className={cn(
                  'ml-0.5 rounded p-0.5',
                  'opacity-0 transition-opacity duration-100',
                  'group-hover:opacity-70 hover:!opacity-100',
                  'hover:bg-destructive/20 hover:text-destructive',
                  'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New file button */}
      <button
        onClick={handleAddTab}
        className={cn(
          'shrink-0 p-2 text-muted-foreground',
          'hover:bg-accent/50 hover:text-foreground',
          'transition-colors duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        title="ملف جديد"
        aria-label="ملف جديد"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
