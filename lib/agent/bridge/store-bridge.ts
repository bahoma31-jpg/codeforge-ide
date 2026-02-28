/**
 * CodeForge IDE — Store Bridge
 * Bridges agent tool operations with UI stores.
 * Ensures File Explorer, Editor tabs, and Git panel
 * stay in sync when the agent modifies files.
 */

import { logger } from '@/lib/monitoring/error-logger';

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

    if (editorStore && typeof editorStore === 'object') {
      const store = editorStore as unknown as Record<string, unknown>;

      if ('tabs' in store && Array.isArray(store.tabs)) {
        const tabs = store.tabs as Array<{ id: string; fileId?: string }>;
        const isOpen = tabs.some(
          (tab) => tab.fileId === fileId || tab.id === fileId
        );

        if (isOpen && typeof store.updateTabContent === 'function') {
          store.updateTabContent(fileId, newContent);
        }
      }

      // If the active file is this file, update it
      if ('activeFileId' in store && store.activeFileId === fileId) {
        if (typeof store.setContent === 'function') {
          store.setContent(newContent);
        }
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

    if (editorStore && typeof editorStore === 'object') {
      const store = editorStore as unknown as Record<string, unknown>;
      if (typeof store.closeTab === 'function') {
        store.closeTab(fileId);
      }
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
    const state = useNotificationStore.getState();

    const title = type.charAt(0).toUpperCase() + type.slice(1);

    if (state && typeof state === 'object') {
      const store = state as unknown as Record<string, unknown>;
      if (typeof store.addNotification === 'function') {
        store.addNotification({ title, message, type });
      } else if (typeof store.add === 'function') {
        store.add({ title, message, type });
      }
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
    const state = useGitStore.getState();

    if (state && typeof state === 'object') {
      const store = state as unknown as Record<string, unknown>;
      if (typeof store.refresh === 'function') {
        await store.refresh();
      } else if (typeof store.loadStatus === 'function') {
        await store.loadStatus();
      }
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
