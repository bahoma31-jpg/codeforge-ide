import { useEffect } from 'react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

export function useMonacoKeyboardShortcuts(
  editorInstance: editor.IStandaloneCodeEditor | null
) {
  useEffect(() => {
    if (!editorInstance) return;

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
  }, [editorInstance]);
}
