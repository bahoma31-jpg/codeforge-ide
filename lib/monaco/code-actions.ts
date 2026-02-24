import * as monaco from "monaco-editor";

export function registerCodeActions() {
  monaco.languages.registerCodeActionProvider("typescript", {
    provideCodeActions: (model, range, context) => {
      const actions: monaco.languages.CodeAction[] = [];

      if (context.only === "quickfix") {
        const word = model.getWordAtPosition(range.getStartPosition());
        if (word) {
          actions.push({
            title: `Log "${word.word}" to console`,
            kind: "quickfix",
            edit: {
              edits: [
                {
                  resource: model.uri,
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
