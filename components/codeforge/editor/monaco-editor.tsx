"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Editor, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { defaultMonacoOptions } from "@/lib/monaco/monaco-config";
import { registerCodeForgeThemes } from "@/lib/monaco/theme-config";
import {
  configureTypeScriptDefaults,
  configureHTMLDefaults,
  configureCSSDefaults,
  configureJSONDefaults,
  addExtraLibraries,
  registerCustomSnippets,
} from "@/lib/monaco/language-providers";
import { registerCodeActions } from "@/lib/monaco/code-actions";
import { useMonacoKeyboardShortcuts } from "@/lib/hooks/useMonacoEditor";
import { EditorSkeleton } from "@/components/ui/loading-spinner";

function MonacoEditor() {
  const { tabs, activeTabId, updateTabContent } = useEditorStore();
  const { theme } = useUIStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // ✅ تفعيل اختصارات لوحة المفاتيح
  useMonacoKeyboardShortcuts(editorRef.current);

  // Memoize active tab to avoid unnecessary re-renders
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId),
    [tabs, activeTabId]
  );

  // Memoize theme name
  const monacoTheme = useMemo(
    () => (theme === "light" ? "codeforge-light" : "codeforge-dark"),
    [theme]
  );

  // useCallback for handleEditorDidMount to prevent recreation
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register custom themes
    registerCodeForgeThemes(monaco);

    // Configure language providers
    configureTypeScriptDefaults();
    configureHTMLDefaults();
    configureCSSDefaults();
    configureJSONDefaults();
    addExtraLibraries();
    registerCustomSnippets();
    registerCodeActions();

    // Apply initial theme
    const monacoTheme = theme === "light" ? "codeforge-light" : "codeforge-dark";
    monaco.editor.setTheme(monacoTheme);

    // Focus editor
    editor.focus();
  }, [theme]);

  // useCallback for handleEditorChange
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ theme: monacoTheme });
    }
  }, [monacoTheme]);

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No file open. Click the button or open a file from Explorer.</p>
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
      theme={monacoTheme}
      loading={<EditorSkeleton />}
    />
  );
}

// Export memoized version to prevent unnecessary re-renders
export default MonacoEditor;
