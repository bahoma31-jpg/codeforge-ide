/**
 * CodeForge IDE — File Path Detection Utility
 * Detects file paths in chat message text and provides
 * helpers to determine language from file extension.
 */

// Common code file extensions
const CODE_EXTENSIONS = new Set([
  // JavaScript / TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  // Web
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'vue',
  'svelte',
  // Data / Config
  'json',
  'yaml',
  'yml',
  'toml',
  'xml',
  'env',
  'ini',
  'conf',
  // Backend
  'py',
  'rb',
  'php',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'h',
  // Shell / DevOps
  'sh',
  'bash',
  'zsh',
  'ps1',
  'bat',
  'cmd',
  'dockerfile',
  // Docs
  'md',
  'mdx',
  'txt',
  'csv',
  'sql',
  // Config files
  'gitignore',
  'eslintrc',
  'prettierrc',
  'editorconfig',
]);

// Map file extensions to Monaco language IDs
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  rb: 'ruby',
  php: 'php',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  ps1: 'powershell',
  bat: 'bat',
  sql: 'sql',
  vue: 'html',
  svelte: 'html',
  dockerfile: 'dockerfile',
  toml: 'ini',
  ini: 'ini',
  env: 'ini',
  csv: 'plaintext',
  txt: 'plaintext',
  svg: 'xml',
};

/**
 * Regex to detect file paths in text.
 * Matches patterns like:
 *   - src/app/page.tsx
 *   - ./components/ui/button.tsx
 *   - lib/stores/editor-store.ts
 *   - package.json
 *   - .eslintrc.json
 *   - next.config.mjs
 */
const FILE_PATH_REGEX =
  /(?:^|[\s`"'(\[{,])(\.?\.?\/?)([a-zA-Z0-9_@.-]+(?:\/[a-zA-Z0-9_@.-]+)*\.[a-zA-Z0-9]+)(?=[\s`"')\]},.:;!?]|$)/g;

export interface TextSegment {
  type: 'text' | 'filepath';
  value: string;
  /** Cleaned file path (without leading ./ or ../) */
  filePath?: string;
  /** Detected language for Monaco */
  language?: string;
}

/**
 * Check if a file extension is a known code file extension
 */
function isCodeExtension(ext: string): boolean {
  return CODE_EXTENSIONS.has(ext.toLowerCase());
}

/**
 * Get Monaco language ID from file extension
 */
export function getLanguageFromExtension(ext: string): string {
  return EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'plaintext';
}

/**
 * Get file extension from a file path
 */
export function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filePath.slice(lastDot + 1).toLowerCase();
}

/**
 * Clean a file path by removing leading ./ or ../
 */
function cleanFilePath(prefix: string, path: string): string {
  const full = prefix + path;
  // Remove leading ./ or ../
  return full.replace(/^\.{1,2}\//, '');
}

/**
 * Parse a text string and split it into text segments and file path segments.
 * File paths are detected and enriched with language information.
 */
export function parseFilePathsFromText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Reset regex state
  FILE_PATH_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = FILE_PATH_REGEX.exec(text)) !== null) {
    const prefix = match[1]; // ./ or ../ or /
    const pathPart = match[2]; // the actual path
    const ext = getExtension(pathPart);

    // Only treat as file path if extension is a known code extension
    if (!isCodeExtension(ext)) {
      continue;
    }

    const fullMatch = prefix + pathPart;
    const matchStart = match.index + (match[0].length - fullMatch.length);

    // Add text before this match
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, matchStart),
      });
    }

    const cleanedPath = cleanFilePath(prefix, pathPart);

    segments.push({
      type: 'filepath',
      value: fullMatch,
      filePath: cleanedPath,
      language: getLanguageFromExtension(ext),
    });

    lastIndex = matchStart + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Extract file name from a full path
 */
export function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}
