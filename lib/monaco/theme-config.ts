import { editor } from 'monaco-editor';

export const codeforgeLight: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '626262', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0284c7', fontStyle: 'bold' },
    { token: 'string', foreground: '16a34a' },
    { token: 'number', foreground: 'c2410c' },
    { token: 'variable', foreground: '0f172a' },
    { token: 'function', foreground: '7c3aed' },
    { token: 'type', foreground: '0891b2' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#0f172a',
    'editor.lineHighlightBackground': '#f1f5f9',
    'editor.selectionBackground': '#bfdbfe',
    'editorLineNumber.foreground': '#94a3b8',
    'editorLineNumber.activeForeground': '#475569',
    'editorCursor.foreground': '#0284c7',
  },
};

export const coforgeDark: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
    { token: 'string', foreground: '4ade80' },
    { token: 'number', foreground: 'fb923c' },
    { token: 'variable', foreground: 'f1f5f9' },
    { token: 'function', foreground: 'a78bfa' },
    { token: 'type', foreground: '22d3ee' },
  ],
  colors: {
    'editor.background': '#1f2121',
    'editor.foreground': '#f5f5f5',
    'editor.lineHighlightBackground': '#262828',
    'editor.selectionBackground': '#1e3a8a',
    'editorLineNumber.foreground': '#64748b',
    'editorLineNumber.activeForeground': '#cbd5e1',
    'editorCursor.foreground': '#38bdf8',
  },
};

export function registerCodeForgeThemes(
  monaco: typeof import('monaco-editor')
) {
  monaco.editor.defineTheme('codeforge-light', codeforgeLight);
  monaco.editor.defineTheme('codeforge-dark', coforgeDark);
}
