export const APP_NAME = 'CodeForge IDE';
export const APP_VERSION = '0.1.0';

export const FILE_TYPES = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  MARKDOWN: 'markdown',
} as const;

export const STORAGE_KEYS = {
  GITHUB_TOKEN: 'codeforge_github_token',
  THEME: 'codeforge_theme',
  FILES: 'codeforge_files',
  SETTINGS: 'codeforge_settings',
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
} as const;

export const EDITOR_DEFAULTS = {
  FONT_SIZE: 14,
  TAB_SIZE: 2,
  LINE_HEIGHT: 1.6,
  MINIMAP_ENABLED: true,
  WORD_WRAP: 'on' as const,
};

export const GITHUB_API_BASE = 'https://api.github.com';
