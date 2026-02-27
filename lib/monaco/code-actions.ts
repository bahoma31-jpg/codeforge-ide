/**
 * CodeForge IDE — Monaco Code Actions
 * Provides quick-fix code actions for TypeScript.
 *
 * IMPORTANT: Receives monaco instance from onMount.
 * Do NOT import 'monaco-editor' directly.
 */

type Monaco = typeof import('monaco-editor');

export function registerCodeActions(monaco: Monaco) {
  monaco.languages.registerCodeActionProvider('typescript', {
    provideCodeActions: (model, range, context) => {
      const actions: import('monaco-editor').languages.CodeAction[] = [];

      if (context.only === 'quickfix') {
        const word = model.getWordAtPosition(range.getStartPosition());
        if (word) {
          actions.push({
            title: `Log "${word.word}" to console`,
            kind: 'quickfix',
            edit: {
              edits: [
                {
                  resource: model.uri,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: range.endLineNumber,
                      startColumn: 1,
                      endLineNumber: range.endLineNumber,
                      endColumn: 1,
                    },
                    text: `console.log("${word.word}", ${word.word});\n`,
                  },
                },
              ],
            },
          });
        }
      }

      return { actions, dispose: () => {} };
    },
  });
}
