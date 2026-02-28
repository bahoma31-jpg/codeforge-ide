/**
 * CodeForge IDE — Store Bridge
 * Bridges agent tool operations with UI stores.
 * Ensures File Explorer, Editor tabs, and Git panel
 * stay in sync when the agent modifies files.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FileNode } from '@/lib/db/schema';

import type { FileNode } from '@/lib/db/schema';
import { logger } from '@/lib/monitoring/error-logger';

interface IDynamicEditorStore {
  tabs?: Array<{ id: string; fileId?: string }>;
  activeFileId?: string;
  updateTabContent?: (fileId: string, content: string) => void;
  setContent?: (content: string) => void;
  closeTab?: (fileId: string) => void;
}

/**
 * Refresh the file tree in the File Explorer.
 * Call after any file create/delete/rename/move.
 */
export async function refreshFileTree(): Promise<void> {
  try {
    const { useFilesStore } = await import('@/lib/stores/files-store');
    await useFilesStore.getState().loadFileTree();
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to refresh file tree',
      error instanceof Error ? error : undefined,
      { source: 'refreshFileTree' }
    );
  }
}

/**
 * Refresh a specific file in the editor if it's currently open.
 * Call after update_file to sync the editor content.
 */
export async function refreshOpenFile(
  fileId: string,
  newContent: string
): Promise<void> {
  try {
    const { useEditorStore } = await import('@/lib/stores/editor-store');
    const editorStore = useEditorStore.getState();

    // Check if this file is in an open tab
    const dynamicStore = editorStore as unknown as IDynamicEditorStore;
    if ('tabs' in editorStore) {
      const tabs = dynamicStore.tabs;
      const isOpen = tabs?.some(
        (tab) => tab.fileId === fileId || tab.id === fileId
      );

      if (isOpen && typeof dynamicStore.updateTabContent === 'function') {
        dynamicStore.updateTabContent(fileId, newContent);
      }
    }

    // If the active file is this file, update it
    if ('activeFileId' in editorStore && dynamicStore.activeFileId === fileId) {
      if (typeof dynamicStore.setContent === 'function') {
        dynamicStore.setContent(newContent);
      }
    }
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to refresh open file',
      error instanceof Error ? error : undefined,
      { source: 'refreshOpenFile' }
    );
  }
}

/**
 * Close editor tab for a deleted file.
 */
export async function closeDeletedFileTab(fileId: string): Promise<void> {
  try {
    const { useEditorStore } = await import('@/lib/stores/editor-store');
    const editorStore = useEditorStore.getState();

    const dynamicStore = editorStore as unknown as IDynamicEditorStore;
    if (typeof dynamicStore.closeTab === 'function') {
      dynamicStore.closeTab(fileId);
    }
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to close deleted file tab',
      error instanceof Error ? error : undefined,
      { source: 'closeDeletedFileTab' }
    );
  }
}

/**
 * Expand the parent folder in File Explorer after creating a file/folder.
 */
export async function expandParentFolder(
  parentId: string | null
): Promise<void> {
  if (!parentId) return;
  try {
    const { useFilesStore } = await import('@/lib/stores/files-store');
    useFilesStore.getState().expandFolder(parentId);
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to expand parent folder',
      error instanceof Error ? error : undefined,
      { source: 'expandParentFolder' }
    );
  }
}

/**
 * Send a notification to the user.
 */
export async function sendNotification(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<void> {
  try {
    const { useNotificationStore } =
      await import('@/lib/stores/notification-store');
    const store = useNotificationStore.getState();

    interface IDynamicNotificationStore {
      add?: (opts: { message: string; type: string }) => void;
    }
    if (typeof store.addNotification === 'function') {
      store.addNotification({ message, type });
    } else if (
      typeof (store as unknown as IDynamicNotificationStore).add === 'function'
    ) {
      (store as unknown as IDynamicNotificationStore).add!({ message, type });
    }
  } catch (error) {
    logger.warn(
      '[StoreBridge] Notification store not available:',
      error instanceof Error ? error : undefined,
      { source: 'sendNotification' }
    );
  }
}

/**
 * Refresh git store state after git operations.
 */
export async function refreshGitState(): Promise<void> {
  try {
    const { useGitStore } = await import('@/lib/stores/git-store');
    const store = useGitStore.getState();

    interface IDynamicGitStore {
      loadStatus?: () => Promise<void>;
    }
    if (typeof store.refresh === 'function') {
      await store.refresh();
    } else if (
      typeof (store as unknown as IDynamicGitStore).loadStatus === 'function'
    ) {
      await (store as unknown as IDynamicGitStore).loadStatus!();
    }
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to refresh git state',
      error instanceof Error ? error : undefined,
      { source: 'refreshGitState' }
    );
  }
}

/**
 * Set the active file in the editor (navigate to a file).
 */
export async function openFileInEditor(fileId: string): Promise<void> {
  try {
    const { useFilesStore } = await import('@/lib/stores/files-store');
    useFilesStore.getState().setActiveFile(fileId);
  } catch (error) {
    logger.error(
      '[StoreBridge] Failed to open file in editor',
      error instanceof Error ? error : undefined,
      { source: 'openFileInEditor' }
    );
  }
}
