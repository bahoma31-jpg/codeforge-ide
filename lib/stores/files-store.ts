/**
 * CodeForge IDE - Files Store
 * Agent 4: File System Manager
 *
 * Zustand store for file system state management
 */

import { create } from 'zustand';
import { logger } from '@/lib/monitoring/error-logger';
import type { FileNode } from '../db/schema';
import {
  createFile as dbCreateFile,
  createFolder as dbCreateFolder,
  readFile as dbReadFile,
  updateFile as dbUpdateFile,
  deleteNode as dbDeleteNode,
  renameNode as dbRenameNode,
  moveNode as dbMoveNode,
  getChildren as dbGetChildren,
  getRootNodes as dbGetRootNodes,
  getAllNodes as dbGetAllNodes,
  searchFiles as dbSearchFiles,
  FileSystemError,
} from '../db/file-operations';
import { initializeDB } from '../db/indexeddb';

/**
 * Files store state
 */
interface FilesState {
  // State
  nodes: FileNode[];
  rootNodes: FileNode[];
  activeFileId: string | null;
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadFileTree: () => Promise<void>;
  createFile: (
    name: string,
    parentId: string | null,
    content?: string,
    language?: string
  ) => Promise<FileNode>;
  createFolder: (name: string, parentId: string | null) => Promise<FileNode>;
  readFile: (id: string) => Promise<FileNode>;
  updateFile: (id: string, updates: Partial<FileNode>) => Promise<FileNode>;
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<FileNode>;
  moveNode: (id: string, newParentId: string | null) => Promise<FileNode>;
  getChildren: (parentId: string | null) => Promise<FileNode[]>;
  searchFiles: (query: string) => Promise<FileNode[]>;

  // UI Actions
  setActiveFile: (id: string | null) => void;
  setSelectedFile: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;
  clearError: () => void;
}

/**
 * Files store implementation
 */
export const useFilesStore = create<FilesState>((set, get) => ({
  // Initial state
  nodes: [],
  rootNodes: [],
  activeFileId: null,
  selectedFileId: null,
  expandedFolders: new Set<string>(),
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize database and load file tree
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });
    try {
      await initializeDB();
      await get().loadFileTree();
      set({ isInitialized: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to initialize file system';
      set({ error: message });
      logger.error(
        'فشل تهيئة نظام الملفات',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.initialize' }
      );
    } finally {
      set({ isLoading: false });
    }
  },

  // Load file tree from database
  loadFileTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const [allNodes, roots] = await Promise.all([
        dbGetAllNodes(),
        dbGetRootNodes(),
      ]);
      set({ nodes: allNodes, rootNodes: roots });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load file tree';
      set({ error: message });
      logger.error(
        'فشل تحميل شجرة الملفات',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.loadFileTree' }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new file
  createFile: async (name, parentId, content = '', language) => {
    set({ isLoading: true, error: null });
    try {
      const file = await dbCreateFile(name, parentId, content, language);
      await get().loadFileTree();
      return file;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to create file';
      set({ error: message });
      logger.error(
        'فشل إنشاء الملف',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.createFile', name }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new folder
  createFolder: async (name, parentId) => {
    set({ isLoading: true, error: null });
    try {
      const folder = await dbCreateFolder(name, parentId);
      await get().loadFileTree();
      // Auto-expand parent folder
      if (parentId) {
        get().expandFolder(parentId);
      }
      return folder;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to create folder';
      set({ error: message });
      logger.error(
        'فشل إنشاء المجلد',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.createFolder', name }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Read a file
  readFile: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const file = await dbReadFile(id);
      return file;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to read file';
      set({ error: message });
      logger.error(
        'فشل قراءة الملف',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.readFile', id }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update a file
  updateFile: async (id, updates) => {
    try {
      const file = await dbUpdateFile(id, updates);
      // Update nodes in state
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? file : n)),
      }));
      return file;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to update file';
      set({ error: message });
      logger.error(
        'فشل تحديث الملف',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.updateFile', id }
      );
      throw error;
    }
  },

  // Delete a node (file or folder)
  deleteNode: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbDeleteNode(id);
      await get().loadFileTree();

      // Clear active/selected if deleted
      if (get().activeFileId === id) {
        set({ activeFileId: null });
      }
      if (get().selectedFileId === id) {
        set({ selectedFileId: null });
      }
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete node';
      set({ error: message });
      logger.error(
        'فشل حذف العنصر',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.deleteNode', id }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Rename a node
  renameNode: async (id, newName) => {
    set({ isLoading: true, error: null });
    try {
      const node = await dbRenameNode(id, newName);
      await get().loadFileTree();
      return node;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to rename node';
      set({ error: message });
      logger.error(
        'فشل إعادة التسمية',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.renameNode', id, newName }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Move a node
  moveNode: async (id, newParentId) => {
    set({ isLoading: true, error: null });
    try {
      const node = await dbMoveNode(id, newParentId);
      await get().loadFileTree();
      // Auto-expand new parent folder
      if (newParentId) {
        get().expandFolder(newParentId);
      }
      return node;
    } catch (error) {
      const message =
        error instanceof FileSystemError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to move node';
      set({ error: message });
      logger.error(
        'فشل نقل العنصر',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.moveNode', id }
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Get children of a folder
  getChildren: async (parentId) => {
    try {
      return await dbGetChildren(parentId);
    } catch (error) {
      logger.error(
        'فشل جلب العناصر الفرعية',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.getChildren', parentId }
      );
      return [];
    }
  },

  // Search files
  searchFiles: async (query) => {
    try {
      return await dbSearchFiles(query);
    } catch (error) {
      logger.error(
        'فشل البحث في الملفات',
        error instanceof Error ? error : undefined,
        { source: 'FilesStore.searchFiles', query }
      );
      return [];
    }
  },

  // UI Actions
  setActiveFile: (id) => set({ activeFileId: id }),
  setSelectedFile: (id) => set({ selectedFileId: id }),

  toggleFolder: (id) => {
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      if (expanded.has(id)) {
        expanded.delete(id);
      } else {
        expanded.add(id);
      }
      return { expandedFolders: expanded };
    });
  },

  expandFolder: (id) => {
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      expanded.add(id);
      return { expandedFolders: expanded };
    });
  },

  collapseFolder: (id) => {
    set((state) => {
      const expanded = new Set(state.expandedFolders);
      expanded.delete(id);
      return { expandedFolders: expanded };
    });
  },

  clearError: () => set({ error: null }),
}));

// Helper to get node by ID from current state
export function getNodeById(id: string): FileNode | undefined {
  return useFilesStore.getState().nodes.find((n) => n.id === id);
}

// Helper to get children from current state
export function getChildrenFromState(parentId: string | null): FileNode[] {
  return useFilesStore.getState().nodes.filter((n) => n.parentId === parentId);
}

// Helper to check if folder is expanded
export function isFolderExpanded(id: string): boolean {
  return useFilesStore.getState().expandedFolders.has(id);
}
