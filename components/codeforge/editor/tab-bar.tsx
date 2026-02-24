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
              <span className="max-w-[160px] truncate">{tab.fileName}</span>
              {tab.isDirty && <span className="text-xs">&#9679;</span>}
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
