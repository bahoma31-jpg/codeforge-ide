/**
 * CodeForge IDE - Auto-Save Hook
 * Agent 4: File System Manager
 * 
 * Automatically saves editor content to IndexedDB
 */

import { useEffect, useRef, useCallback } from 'react';
import { useFilesStore } from '../stores/files-store';
import { useEditorStore } from '../stores/editor-store';

/**
 * Auto-save configuration
 */
interface AutoSaveConfig {
  delay?: number; // Delay in milliseconds (default: 2000)
  enabled?: boolean; // Enable/disable auto-save (default: true)
  onSave?: (fileId: string) => void; // Callback after successful save
  onError?: (error: Error) => void; // Callback on save error
}

/**
 * Hook to automatically save editor content to file system
 */
export function useAutoSave(config: AutoSaveConfig = {}) {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError
  } = config;

  const { activeTabId, tabs } = useEditorStore();
  const { updateFile } = useFilesStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<Map<string, string>>(new Map());
  const isSavingRef = useRef<boolean>(false);

  /**
   * Save file content to database
   */
  const saveFile = useCallback(async (fileId: string, content: string) => {
    if (isSavingRef.current) {
      console.log(`Already saving ${fileId}, skipping...`);
      return;
    }

    try {
      isSavingRef.current = true;
      await updateFile(fileId, { content, updatedAt: Date.now() });
      lastSavedContentRef.current.set(fileId, content);
      console.log(`Auto-saved: ${fileId}`);
      onSave?.(fileId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Auto-save failed for ${fileId}:`, err);
      onError?.(err);
    } finally {
      isSavingRef.current = false;
    }
  }, [updateFile, onSave, onError]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((fileId: string, content: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveFile(fileId, content);
    }, delay);
  }, [delay, saveFile]);

  /**
   * Watch for content changes and trigger auto-save
   */
  useEffect(() => {
    if (!enabled || !activeTabId) return;

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Check if content has changed
    const lastSavedContent = lastSavedContentRef.current.get(activeTabId);
    const hasChanged = lastSavedContent !== activeTab.content;

    if (hasChanged && activeTab.isDirty) {
      debouncedSave(activeTabId, activeTab.content);
    }

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, activeTabId, tabs, debouncedSave]);

  /**
   * Force save current file immediately
   */
  const forceSave = useCallback(async () => {
    if (!activeTabId) return;

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Cancel pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately
    await saveFile(activeTabId, activeTab.content);
  }, [activeTabId, tabs, saveFile]);

  /**
   * Save all open files
   */
  const saveAll = useCallback(async () => {
    const dirtyTabs = tabs.filter(t => t.isDirty);
    
    await Promise.all(
      dirtyTabs.map(tab => saveFile(tab.id, tab.content))
    );
  }, [tabs, saveFile]);

  return {
    forceSave,
    saveAll,
    isSaving: isSavingRef.current
  };
}

/**
 * Hook to get auto-save status
 */
export function useAutoSaveStatus() {
  const { activeTabId, tabs } = useEditorStore();
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const hasUnsavedChanges = activeTab?.isDirty ?? false;
  const unsavedCount = tabs.filter(t => t.isDirty).length;

  return {
    hasUnsavedChanges,
    unsavedCount,
    activeFileIsDirty: hasUnsavedChanges
  };
}
