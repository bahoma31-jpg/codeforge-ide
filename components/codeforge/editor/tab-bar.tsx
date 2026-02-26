'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
              className={cn(
                'group flex shrink-0 items-center gap-2 border-r border-border px-3 py-2 text-sm',
                'hover:bg-secondary',
                active
                  ? 'bg-secondary font-medium text-primary'
                  : 'text-muted-foreground'
              )}
              title={tab.filePath}
            >
              <span className="max-w-[160px] truncate">{tab.fileName}</span>
              {tab.isDirty && <span className="text-xs">&#9679;</span>}
              <button
                className={cn(
                  'ml-1 inline-flex rounded p-0.5',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                  'hover:bg-muted-foreground/20',
                  'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeTab(tab.id);
                  }
                }}
                aria-label={`Close ${tab.fileName}`}
                aria-keyshortcuts="Ctrl+W"
                tabIndex={0}
              >
                <X className="h-3.5 w-3.5 hover:text-destructive" />
              </button>
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
