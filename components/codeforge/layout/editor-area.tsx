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
