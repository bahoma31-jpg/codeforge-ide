'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  title: string;
  path: string;
  isDirty: boolean;
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: EditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex items-center bg-muted border-b overflow-x-auto"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`editor-panel-${tab.id}`}
            aria-label={`${tab.title}${tab.isDirty ? ' (modified)' : ''}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabClick(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabClick(tab.id);
              }
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-r cursor-pointer',
              'hover:bg-accent transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              isActive && 'bg-background'
            )}
          >
            <span className="text-sm truncate max-w-[150px]">
              {tab.title}
              {tab.isDirty && (
                <span aria-label="Modified" className="ml-1">
                  •
                </span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              aria-label={`Close ${tab.title}`}
              aria-keyshortcuts="Ctrl+W"
              className={cn(
                'p-1 rounded hover:bg-muted-foreground/20',
                'focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
