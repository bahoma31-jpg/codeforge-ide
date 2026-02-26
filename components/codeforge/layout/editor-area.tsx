'use client';

/**
 * CodeForge IDE — Editor Area
 * Main editor area with tab bar and Monaco editor.
 * Uses EditorTabs (unified, accessible) instead of old TabBar.
 */

import { useEditorStore } from '@/lib/stores/editor-store';
import { EditorTabs } from '../editor/editor-tabs';
import { MonacoEditor } from '@/lib/utils/monaco-loader';
import { WelcomeScreen } from '@/components/codeforge/welcome/welcome-screen';

export default function EditorArea() {
  const { tabs } = useEditorStore();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[hsl(var(--cf-editor))]">
      {tabs.length > 0 && <EditorTabs />}
      <div className="flex-1 overflow-hidden">
        {tabs.length > 0 ? <MonacoEditor /> : <WelcomeScreen />}
      </div>
    </div>
  );
}
