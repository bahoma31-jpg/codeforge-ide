'use client';

/**
 * CodeForge IDE — Editor Area v2.0
 * Main editor area with tab bar and Monaco editor.
 * Uses EditorTabs (unified, accessible) instead of old TabBar.
 *
 * v2.0 — Added activeTab tracking to ensure content displays
 *         when files are opened from chat or sidebar.
 */

import { useEditorStore } from '@/lib/stores/editor-store';
import { EditorTabs } from '../editor/editor-tabs';
import { MonacoEditor } from '@/lib/utils/monaco-loader';
import { WelcomeScreen } from '@/components/codeforge/welcome/welcome-screen';

export default function EditorArea() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);

  // Find the active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[hsl(var(--cf-editor))]">
      {tabs.length > 0 && <EditorTabs />}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <MonacoEditor
            key={activeTab.id}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
