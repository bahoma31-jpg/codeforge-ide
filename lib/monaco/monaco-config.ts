import type { editor } from 'monaco-editor';

export const defaultMonacoOptions: editor.IStandaloneEditorConstructionOptions =
  {
    // Basic Settings
    fontSize: 14,
    fontFamily: "'Berkeley Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineHeight: 21,
    letterSpacing: 0,

    // Editor Behavior
    automaticLayout: true,
    minimap: { enabled: true, side: 'right' },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    lineNumbers: 'on',
    renderWhitespace: 'selection',

    // IntelliSense & Autocomplete
    quickSuggestions: { other: true, comments: false, strings: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',

    // Code Actions
    lightbulb: { enabled: 'on' },
    codeLens: true,

    // Formatting
    formatOnPaste: true,
    formatOnType: false,

    // Bracket Matching
    matchBrackets: 'always',
    bracketPairColorization: { enabled: true },

    // Folding
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',

    // Scrollbars
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
    },

    // Performance
    renderValidationDecorations: 'on',
  };

export const supportedLanguages = [
  {
    id: 'javascript',
    label: 'JavaScript',
    extensions: ['.js', '.mjs', '.cjs'],
  },
  { id: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { id: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', label: 'CSS', extensions: ['.css'] },
  { id: 'json', label: 'JSON', extensions: ['.json'] },
  { id: 'markdown', label: 'Markdown', extensions: ['.md'] },
  { id: 'python', label: 'Python', extensions: ['.py'] },
  { id: 'go', label: 'Go', extensions: ['.go'] },
  { id: 'rust', label: 'Rust', extensions: ['.rs'] },
  { id: 'plaintext', label: 'Plain Text', extensions: ['.txt'] },
] as const;

export function detectLanguage(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  const lang = supportedLanguages.find((l) =>
    l.extensions.includes(ext as any)
  );
  return lang?.id ?? 'plaintext';
}
