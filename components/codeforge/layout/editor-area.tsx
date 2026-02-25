'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import TabBar from '../editor/tab-bar';
import MonacoEditor from '../editor/monaco-editor';

export default function EditorArea() {
  const { tabs } = useEditorStore();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[hsl(var(--cf-editor))]">
      <TabBar />
      <div className="flex-1 overflow-hidden">
        {tabs.length > 0 ? (
          <MonacoEditor />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Welcome to CodeForge IDE</p>
              <p className="mt-2 text-sm">
                Create a new file or open an existing one to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
