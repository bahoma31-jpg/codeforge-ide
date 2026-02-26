/**
 * CodeForge IDE — Store Bridge
 * Bridges agent tool operations with UI stores.
 * Ensures File Explorer, Editor tabs, and Git panel
 * stay in sync when the agent modifies files.
 */

import type { FileNode } from '@/lib/db/schema';

/**
 * Refresh the file tree in the File Explorer.
 * Call after any file create/delete/rename/move.
 */
export async function refreshFileTree(): Promise<void> {
  try {
    const { useFilesStore } = await import('@/lib/stores/files-store');
    await useFilesStore.getState().loadFileTree();
  } catch (error) {
    console.error('[StoreBridge] Failed to refresh file tree:', error);
  }
}

/**
 * Refresh a specific file in the editor if it's currently open.
 * Call after update_file to sync the editor content.
 */
export async function refreshOpenFile(fileId: string, newContent: string): Promise<void> {
  try {
    const { useEditorStore } = await import('@/lib/stores/editor-store');
    const editorStore = useEditorStore.getState();

    // Check if this file is in an open tab
    if ('tabs' in editorStore) {
      const tabs = (editorStore as any).tabs as Array<{ id: string; fileId?: string }>;
      const isOpen = tabs?.some((tab) => tab.fileId === fileId || tab.id === fileId);

      if (isOpen && typeof (editorStore as any).updateTabContent === 'function') {
        (editorStore as any).updateTabContent(fileId, newContent);
      }
    }

    // If the active file is this file, update it
    if ('activeFileId' in editorStore && (editorStore as any).activeFileId === fileId) {
      if (typeof (editorStore as any).setContent === 'function') {
        (editorStore as any).setContent(newContent);
      }
    }
  } catch (error) {
    console.error('[StoreBridge] Failed to refresh open file:', error);
  }
}

/**
 * Close editor tab for a deleted file.
 */
export async function closeDeletedFileTab(fileId: string): Promise<void> {
  try {
    const { useEditorStore } = await import('@/lib/stores/editor-store');
    const editorStore = useEditorStore.getState();

    if (typeof (editorStore as any).closeTab === 'function') {
      (editorStore as any).closeTab(fileId);
    }
  } catch (error) {
    console.error('[StoreBridge] Failed to close deleted file tab:', error);
  }
}

/**
 * Expand the parent folder in File Explorer after creating a file/folder.
 */
export async function expandParentFolder(parentId: string | null): Promise<void> {
  if (!parentId) return;
  try {
    const { useFilesStore } = await import('@/lib/stores/files-store');
    useFilesStore.getState().expandFolder(parentId);
  } catch (error) {
    console.error('[StoreBridge] Failed to expand parent folder:', error);
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
    const { useNotificationStore } = await import('@/lib/stores/notification-store');
    const store = useNotificationStore.getState();

    if (typeof store.addNotification === 'function') {
      store.addNotification({ message, type });
    } else if (typeof (store as any).add === 'function') {
      (store as any).add({ message, type });
    }
  } catch (error) {
    console.warn('[StoreBridge] Notification store not available:', error);
  }
}

/**
 * Refresh git store state after git operations.
 */
export async function refreshGitState(): Promise<void> {
  try {
    const { useGitStore } = await import('@/lib/stores/git-store');
    const store = useGitStore.getState();

    if (typeof store.refresh === 'function') {
      await store.refresh();
    } else if (typeof (store as any).loadStatus === 'function') {
      await (store as any).loadStatus();
    }
  } catch (error) {
    console.error('[StoreBridge] Failed to refresh git state:', error);
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
    console.error('[StoreBridge] Failed to open file in editor:', error);
  }
}
