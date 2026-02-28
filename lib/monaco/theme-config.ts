/**
 * CodeForge IDE — Monaco Theme Configuration
 * Defines 3 themes: Light, Dark, High Contrast.
 *
 * FIX v2: Added high-contrast theme (codeforge-hc)
 * to match ui-store's CodeforgeTheme type.
 */

import { editor } from 'monaco-editor';

// ─── Light Theme ─────────────────────────────────────────────
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

// ─── Dark Theme ──────────────────────────────────────────────
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

// ─── High Contrast Theme ─────────────────────────────────────
export const codeforgeHighContrast: editor.IStandaloneThemeData = {
  base: 'hc-black',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '7ca668', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'variable', foreground: 'ffffff' },
    { token: 'function', foreground: 'dcdcaa' },
    { token: 'type', foreground: '4ec9b0' },
  ],
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#ffffff',
    'editor.lineHighlightBackground': '#1a1a1a',
    'editor.lineHighlightBorder': '#f38ba8',
    'editor.selectionBackground': '#264f78',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#ffffff',
    'editorCursor.foreground': '#ffffff',
    'editor.selectionHighlightBorder': '#f9e2af',
    contrastBorder: '#6c7086',
    contrastActiveBorder: '#89b4fa',
  },
};

// ─── Register All Themes ─────────────────────────────────────
export function registerCodeForgeThemes(
  monaco: typeof import('monaco-editor')
) {
  monaco.editor.defineTheme('codeforge-light', codeforgeLight);
  monaco.editor.defineTheme('codeforge-dark', coforgeDark);
  monaco.editor.defineTheme('codeforge-hc', codeforgeHighContrast);
}
