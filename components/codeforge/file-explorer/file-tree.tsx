/**
 * CodeForge IDE - File Tree Component
 * Agent 4: File System Manager
 * 
 * Displays the file/folder hierarchy
 */

'use client';

import { useEffect } from 'react';
import { useFilesStore } from '@/lib/stores/files-store';
import { FileTreeItem } from './file-tree-item';
import { Loader2 } from 'lucide-react';
import { initializeSampleFiles } from '@/lib/utils/initial-files';

export default function FileTree() {
  const {
    rootNodes,
    isLoading,
    error,
    isInitialized,
    initialize,
    loadFileTree
  } = useFilesStore();

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (!isInitialized) {
        await initialize();
        
        // Create sample files if database is empty
        try {
          await initializeSampleFiles();
          await loadFileTree();
        } catch (error) {
          console.error('Failed to initialize sample files:', error);
        }
      }
    };

    init();
  }, [isInitialized, initialize, loadFileTree]);

  // Loading state
  if (isLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading file system...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Error loading files</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && rootNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm mb-2">No files yet</p>
          <p className="text-xs">Create a new file to get started</p>
        </div>
      </div>
    );
  }

  // File tree
  return (
    <div className="py-2">
      {rootNodes.map((node) => (
        <FileTreeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}
