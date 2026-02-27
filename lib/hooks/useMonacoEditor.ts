/**
 * CodeForge IDE — Monaco Keyboard Shortcuts Hook
 * Registers Ctrl+S, Ctrl+Shift+F, Ctrl+/ shortcuts.
 *
 * IMPORTANT: Receives monaco instance from onMount.
 * Do NOT import 'monaco-editor' directly.
 */

import { useEffect } from 'react';
import type { editor } from 'monaco-editor';

type Monaco = typeof import('monaco-editor');

export function useMonacoKeyboardShortcuts(
  editorInstance: editor.IStandaloneCodeEditor | null,
  monaco: Monaco | null
) {
  useEffect(() => {
    if (!editorInstance || !monaco) return;

    // Ctrl+S: Save (placeholder)
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        // TODO: Agent 4 will implement actual file saving
        console.log('Save triggered (placeholder)');
      }
    );

    // Ctrl+Shift+F: Format Document
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        editorInstance.getAction('editor.action.formatDocument')?.run();
      }
    );

    // Ctrl+/: Toggle Line Comment
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
      () => {
        editorInstance.getAction('editor.action.commentLine')?.run();
      }
    );
  }, [editorInstance, monaco]);
}
