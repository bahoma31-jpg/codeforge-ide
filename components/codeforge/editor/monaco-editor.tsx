'use client';

/**
 * CodeForge IDE — Monaco Editor v2.1
 * Main code editor component with multi-tab support.
 *
 * v2.1 — Fixed: All helper modules now receive the monaco instance
 * from onMount instead of importing 'monaco-editor' directly.
 * This prevents the dual-instance bug where the NPM package
 * and the CDN-loaded instance would conflict.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useUIStore, type CodeforgeTheme } from '@/lib/stores/ui-store';
import { defaultMonacoOptions } from '@/lib/monaco/monaco-config';
import { registerCodeForgeThemes } from '@/lib/monaco/theme-config';
import {
  configureTypeScriptDefaults,
  configureHTMLDefaults,
  configureCSSDefaults,
  configureJSONDefaults,
  addExtraLibraries,
  registerCustomSnippets,
} from '@/lib/monaco/language-providers';
import { registerCodeActions } from '@/lib/monaco/code-actions';
import { useMonacoKeyboardShortcuts } from '@/lib/hooks/useMonacoEditor';

/**
 * Map app theme to Monaco theme name
 */
function getMonacoThemeName(appTheme: CodeforgeTheme): string {
  switch (appTheme) {
    case 'light':
      return 'codeforge-light';
    case 'high-contrast':
      return 'codeforge-hc';
    case 'dark':
    default:
      return 'codeforge-dark';
  }
}

export default function MonacoEditor() {
  const { tabs, activeTabId, updateTabContent } = useEditorStore();
  const { theme } = useUIStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  // Keyboard shortcuts — pass both editor and monaco instance
  useMonacoKeyboardShortcuts(editorRef.current, monacoRef.current);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorDidMount: OnMount = useCallback(
    (editorInstance, monacoInstance) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;

      // Register all custom themes
      registerCodeForgeThemes(monacoInstance);

      // Configure language providers — pass the CDN-loaded monaco instance
      configureTypeScriptDefaults(monacoInstance);
      configureHTMLDefaults(monacoInstance);
      configureCSSDefaults(monacoInstance);
      configureJSONDefaults(monacoInstance);
      addExtraLibraries(monacoInstance);
      registerCustomSnippets(monacoInstance);
      registerCodeActions(monacoInstance);

      // Apply initial theme via the correct API
      const monacoTheme = getMonacoThemeName(theme);
      monacoInstance.editor.setTheme(monacoTheme);

      // Focus editor
      editorInstance.focus();
    },
    [theme]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  /**
   * FIX: Use monaco.editor.setTheme() — the global API.
   * editor.updateOptions({ theme }) does NOT change the theme;
   * it only works for editor-level options like fontSize, wordWrap, etc.
   */
  useEffect(() => {
    if (monacoRef.current) {
      const monacoTheme = getMonacoThemeName(theme);
      monacoRef.current.editor.setTheme(monacoTheme);
    }
  }, [theme]);

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>
          \u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0644\u0641
          \u0645\u0641\u062a\u0648\u062d. \u0627\u0641\u062a\u062d
          \u0645\u0644\u0641\u0627\u064b \u0645\u0646
          \u0627\u0644\u0645\u0633\u062a\u0643\u0634\u0641 \u0623\u0648
          \u0627\u0636\u063a\u0637 +
        </p>
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={activeTab.language}
      value={activeTab.content}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={defaultMonacoOptions}
      theme={getMonacoThemeName(theme)}
      loading={
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">
              \u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644
              \u0627\u0644\u0645\u062d\u0631\u0631...
            </p>
          </div>
        </div>
      }
    />
  );
}
