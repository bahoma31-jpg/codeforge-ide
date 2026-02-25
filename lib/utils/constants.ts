export const APP_NAME = 'CodeForge IDE';
export const APP_VERSION = '0.1.0';

export const FILE_TYPE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescriptreact',
  js: 'javascript',
  jsx: 'javascriptreact',
  json: 'json',
  html: 'html',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  rb: 'ruby',
  php: 'php',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  sh: 'shell',
  bash: 'shell',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  graphql: 'graphql',
  dockerfile: 'dockerfile',
  txt: 'plaintext',
};

export const SUPPORTED_LANGUAGES = Object.values(FILE_TYPE_MAP);

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
