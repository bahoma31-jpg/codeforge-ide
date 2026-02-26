/**
 * CodeForge IDE — File System Service
 * Provides file system access using the File System Access API
 * with graceful fallback for unsupported browsers.
 */

import type { FileNode } from '@/lib/db/schema';
import {
  createFile as dbCreateFile,
  createFolder as dbCreateFolder,
  clearAllFiles,
  getAllNodes,
} from '@/lib/db/file-operations';
import { useFilesStore } from '@/lib/stores/files-store';

/** Check if File System Access API is available */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Open a native directory picker and import all files into IndexedDB.
 * Falls back to <input type="file"> with webkitdirectory for unsupported browsers.
 */
export async function openFolder(): Promise<{ imported: number; rootName: string }> {
  if (isFileSystemAccessSupported()) {
    return openFolderNative();
  }
  return openFolderFallback();
}

/** Native File System Access API implementation */
async function openFolderNative(): Promise<{ imported: number; rootName: string }> {
  // @ts-expect-error — showDirectoryPicker is not in all TS libs yet
  const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    mode: 'read',
  });

  // Clear existing files before import
  await clearAllFiles();

  let imported = 0;

  // Create root folder
  const root = await dbCreateFolder(dirHandle.name, null);

  // Recursively import directory
  async function importDir(handle: FileSystemDirectoryHandle, parentId: string) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const content = await file.text();
        const lang = detectLanguage(entry.name);
        await dbCreateFile(entry.name, parentId, content, lang);
        imported++;
      } else if (entry.kind === 'directory') {
        const folder = await dbCreateFolder(entry.name, parentId);
        await importDir(entry as FileSystemDirectoryHandle, folder.id);
      }
    }
  }

  await importDir(dirHandle, root.id);

  // Reload file tree
  await useFilesStore.getState().loadFileTree();

  return { imported, rootName: dirHandle.name };
}

/** Fallback for browsers without File System Access API */
function openFolderFallback(): Promise<{ imported: number; rootName: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.multiple = true;

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) {
        reject(new Error('No files selected'));
        return;
      }

      await clearAllFiles();

      // Extract root folder name from first file's path
      const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
      const rootName = firstPath.split('/')[0] || 'imported-project';
      const root = await dbCreateFolder(rootName, null);

      // Track created folders to avoid duplicates
      const folderMap = new Map<string, string>();
      folderMap.set(rootName, root.id);

      let imported = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = (file as any).webkitRelativePath || file.name;
        const parts = relativePath.split('/');

        // Ensure parent folders exist
        let parentId = root.id;
        for (let j = 1; j < parts.length - 1; j++) {
          const folderPath = parts.slice(0, j + 1).join('/');
          if (!folderMap.has(folderPath)) {
            const folder = await dbCreateFolder(parts[j], parentId);
            folderMap.set(folderPath, folder.id);
          }
          parentId = folderMap.get(folderPath)!;
        }

        // Create file
        const content = await file.text();
        const lang = detectLanguage(file.name);
        await dbCreateFile(file.name, parentId, content, lang);
        imported++;
      }

      await useFilesStore.getState().loadFileTree();
      resolve({ imported, rootName });
    };

    input.oncancel = () => reject(new Error('Folder selection cancelled'));
    input.click();
  });
}

/**
 * Export the entire project as a downloadable ZIP-like structure.
 * Uses a simple approach: creates a Blob with JSON containing all files.
 */
export async function exportProject(): Promise<void> {
  const nodes = await getAllNodes();

  const data = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    files: nodes,
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'codeforge-project.json';
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Import a previously exported project from JSON file.
 */
export async function importProject(): Promise<{ imported: number }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.files || !Array.isArray(data.files)) {
          throw new Error('Invalid project file format');
        }

        await clearAllFiles();

        const { getDBManager } = await import('@/lib/db/indexeddb');
        const db = getDBManager();

        for (const node of data.files) {
          await db.put(node);
        }

        await useFilesStore.getState().loadFileTree();
        resolve({ imported: data.files.length });
      } catch (err) {
        reject(err);
      }
    };

    input.click();
  });
}

/** Simple language detection by file extension */
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c', h: 'c',
    cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', sass: 'scss', less: 'less',
    json: 'json',
    xml: 'xml', svg: 'xml',
    yaml: 'yaml', yml: 'yaml',
    md: 'markdown', mdx: 'markdown',
    sql: 'sql',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    dockerfile: 'dockerfile',
    toml: 'toml',
    ini: 'ini',
    env: 'plaintext',
    txt: 'plaintext',
    gitignore: 'plaintext',
  };
  return map[ext] || 'plaintext';
}
