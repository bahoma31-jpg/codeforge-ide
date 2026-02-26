'use client';

/**
 * CodeForge IDE — Monaco Editor
 * Main code editor component with multi-tab support.
 *
 * FIX v2: Theme switching now uses monaco.editor.setTheme()
 * instead of editor.updateOptions({ theme }) which doesn't work.
 * Monaco instance is stored in a ref for use in useEffect.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
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

  // Keyboard shortcuts
  useMonacoKeyboardShortcuts(editorRef.current);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorDidMount: OnMount = useCallback(
    (editorInstance, monacoInstance) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;

      // Register all custom themes
      registerCodeForgeThemes(monacoInstance);

      // Configure language providers
      configureTypeScriptDefaults();
      configureHTMLDefaults();
      configureCSSDefaults();
      configureJSONDefaults();
      addExtraLibraries();
      registerCustomSnippets();
      registerCodeActions();

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
        <p>لا يوجد ملف مفتوح. افتح ملفاً من المستكشف أو اضغط +</p>
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
            <p className="text-xs text-muted-foreground">جاري تحميل المحرر...</p>
          </div>
        </div>
      }
    />
  );
}
