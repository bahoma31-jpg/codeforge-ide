/**
 * CodeForge IDE - File Icons System
 * Agent 4: File System Manager
 * 
 * Maps file extensions to icons and colors
 */

import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  FileTextIcon,
  FileCodeIcon,
  FileJson,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  ArchiveIcon,
  Settings,
  Database,
  type LucideIcon
} from 'lucide-react';

/**
 * File type configuration
 */
export interface FileTypeConfig {
  icon: LucideIcon;
  color: string;
  label?: string;
}

/**
 * Language to file extension mapping
 */
export const languageExtensions: Record<string, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py', '.pyw', '.pyi'],
  rust: ['.rs'],
  go: ['.go'],
  java: ['.java'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
  c: ['.c', '.h'],
  csharp: ['.cs'],
  php: ['.php'],
  ruby: ['.rb'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
  scala: ['.scala'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.sass', '.less'],
  json: ['.json', '.jsonc'],
  xml: ['.xml', '.svg'],
  markdown: ['.md', '.mdx'],
  yaml: ['.yml', '.yaml'],
  toml: ['.toml'],
  sql: ['.sql'],
  shell: ['.sh', '.bash', '.zsh'],
  dockerfile: ['Dockerfile'],
};

/**
 * File extension to type config mapping
 */
const fileTypeMap: Record<string, FileTypeConfig> = {
  // TypeScript
  '.ts': {
    icon: FileCodeIcon,
    color: 'text-blue-500',
    label: 'TypeScript'
  },
  '.tsx': {
    icon: FileCodeIcon,
    color: 'text-blue-500',
    label: 'TypeScript React'
  },
  
  // JavaScript
  '.js': {
    icon: FileCodeIcon,
    color: 'text-yellow-500',
    label: 'JavaScript'
  },
  '.jsx': {
    icon: FileCodeIcon,
    color: 'text-yellow-500',
    label: 'JavaScript React'
  },
  '.mjs': {
    icon: FileCodeIcon,
    color: 'text-yellow-500',
    label: 'JavaScript Module'
  },
  '.cjs': {
    icon: FileCodeIcon,
    color: 'text-yellow-500',
    label: 'JavaScript CommonJS'
  },
  
  // Python
  '.py': {
    icon: FileCodeIcon,
    color: 'text-blue-400',
    label: 'Python'
  },
  
  // HTML/CSS
  '.html': {
    icon: FileCodeIcon,
    color: 'text-orange-500',
    label: 'HTML'
  },
  '.htm': {
    icon: FileCodeIcon,
    color: 'text-orange-500',
    label: 'HTML'
  },
  '.css': {
    icon: FileCodeIcon,
    color: 'text-pink-500',
    label: 'CSS'
  },
  '.scss': {
    icon: FileCodeIcon,
    color: 'text-pink-500',
    label: 'SCSS'
  },
  '.sass': {
    icon: FileCodeIcon,
    color: 'text-pink-500',
    label: 'Sass'
  },
  '.less': {
    icon: FileCodeIcon,
    color: 'text-pink-500',
    label: 'Less'
  },
  
  // Data formats
  '.json': {
    icon: FileJson,
    color: 'text-gray-500',
    label: 'JSON'
  },
  '.jsonc': {
    icon: FileJson,
    color: 'text-gray-500',
    label: 'JSON with Comments'
  },
  '.xml': {
    icon: FileCodeIcon,
    color: 'text-green-500',
    label: 'XML'
  },
  '.yml': {
    icon: FileTextIcon,
    color: 'text-red-500',
    label: 'YAML'
  },
  '.yaml': {
    icon: FileTextIcon,
    color: 'text-red-500',
    label: 'YAML'
  },
  '.toml': {
    icon: FileTextIcon,
    color: 'text-gray-500',
    label: 'TOML'
  },
  
  // Markdown
  '.md': {
    icon: FileTextIcon,
    color: 'text-white',
    label: 'Markdown'
  },
  '.mdx': {
    icon: FileTextIcon,
    color: 'text-white',
    label: 'MDX'
  },
  
  // Other languages
  '.rs': {
    icon: FileCodeIcon,
    color: 'text-orange-600',
    label: 'Rust'
  },
  '.go': {
    icon: FileCodeIcon,
    color: 'text-cyan-500',
    label: 'Go'
  },
  '.java': {
    icon: FileCodeIcon,
    color: 'text-red-600',
    label: 'Java'
  },
  '.php': {
    icon: FileCodeIcon,
    color: 'text-purple-500',
    label: 'PHP'
  },
  '.rb': {
    icon: FileCodeIcon,
    color: 'text-red-500',
    label: 'Ruby'
  },
  '.swift': {
    icon: FileCodeIcon,
    color: 'text-orange-500',
    label: 'Swift'
  },
  '.kt': {
    icon: FileCodeIcon,
    color: 'text-purple-600',
    label: 'Kotlin'
  },
  
  // Shell scripts
  '.sh': {
    icon: FileCodeIcon,
    color: 'text-green-500',
    label: 'Shell Script'
  },
  '.bash': {
    icon: FileCodeIcon,
    color: 'text-green-500',
    label: 'Bash Script'
  },
  
  // Images
  '.png': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'PNG Image'
  },
  '.jpg': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'JPEG Image'
  },
  '.jpeg': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'JPEG Image'
  },
  '.gif': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'GIF Image'
  },
  '.svg': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'SVG Image'
  },
  '.webp': {
    icon: ImageIcon,
    color: 'text-purple-500',
    label: 'WebP Image'
  },
  
  // Media
  '.mp4': {
    icon: VideoIcon,
    color: 'text-red-500',
    label: 'MP4 Video'
  },
  '.mp3': {
    icon: MusicIcon,
    color: 'text-green-500',
    label: 'MP3 Audio'
  },
  '.wav': {
    icon: MusicIcon,
    color: 'text-green-500',
    label: 'WAV Audio'
  },
  
  // Archives
  '.zip': {
    icon: ArchiveIcon,
    color: 'text-yellow-600',
    label: 'ZIP Archive'
  },
  '.tar': {
    icon: ArchiveIcon,
    color: 'text-yellow-600',
    label: 'TAR Archive'
  },
  '.gz': {
    icon: ArchiveIcon,
    color: 'text-yellow-600',
    label: 'GZIP Archive'
  },
  
  // Config files
  '.env': {
    icon: Settings,
    color: 'text-yellow-500',
    label: 'Environment'
  },
  '.config': {
    icon: Settings,
    color: 'text-gray-500',
    label: 'Configuration'
  },
  
  // Database
  '.sql': {
    icon: Database,
    color: 'text-blue-600',
    label: 'SQL'
  },
  '.db': {
    icon: Database,
    color: 'text-blue-600',
    label: 'Database'
  }
};

/**
 * Special filenames mapping
 */
const specialFilenames: Record<string, FileTypeConfig> = {
  'package.json': {
    icon: FileJson,
    color: 'text-green-600',
    label: 'Package Config'
  },
  'tsconfig.json': {
    icon: FileJson,
    color: 'text-blue-600',
    label: 'TypeScript Config'
  },
  'Dockerfile': {
    icon: FileCodeIcon,
    color: 'text-blue-500',
    label: 'Docker'
  },
  '.gitignore': {
    icon: FileTextIcon,
    color: 'text-orange-600',
    label: 'Git Ignore'
  },
  '.env': {
    icon: Settings,
    color: 'text-yellow-500',
    label: 'Environment'
  },
  '.env.local': {
    icon: Settings,
    color: 'text-yellow-500',
    label: 'Local Environment'
  },
  'README.md': {
    icon: FileTextIcon,
    color: 'text-blue-400',
    label: 'README'
  },
  'LICENSE': {
    icon: FileTextIcon,
    color: 'text-yellow-600',
    label: 'License'
  }
};

/**
 * Default file type
 */
const defaultFileType: FileTypeConfig = {
  icon: FileIcon,
  color: 'text-gray-400',
  label: 'File'
};

/**
 * Folder types
 */
export const folderTypes = {
  closed: {
    icon: FolderIcon,
    color: 'text-blue-500',
    label: 'Folder'
  },
  open: {
    icon: FolderOpenIcon,
    color: 'text-blue-500',
    label: 'Folder'
  }
};

/**
 * Get file type config by filename
 */
export function getFileTypeConfig(filename: string): FileTypeConfig {
  // Check special filenames first
  if (specialFilenames[filename]) {
    return specialFilenames[filename];
  }

  // Get extension
  const ext = getFileExtension(filename);
  
  // Check extension mapping
  if (ext && fileTypeMap[ext]) {
    return fileTypeMap[ext];
  }

  // Return default
  return defaultFileType;
}

/**
 * Get folder type config
 */
export function getFolderTypeConfig(isOpen: boolean): FileTypeConfig {
  return isOpen ? folderTypes.open : folderTypes.closed;
}

/**
 * Get file extension (with dot)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Detect language from filename
 */
export function detectLanguage(filename: string): string | undefined {
  const ext = getFileExtension(filename);
  
  for (const [language, extensions] of Object.entries(languageExtensions)) {
    if (extensions.includes(ext) || extensions.includes(filename)) {
      return language;
    }
  }
  
  return undefined;
}

/**
 * Get all supported extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(fileTypeMap);
}

/**
 * Check if file is image
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'].includes(ext);
}

/**
 * Check if file is media
 */
export function isMediaFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.mp4', '.webm', '.mp3', '.wav', '.ogg'].includes(ext);
}

/**
 * Check if file is archive
 */
export function isArchiveFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext);
}
