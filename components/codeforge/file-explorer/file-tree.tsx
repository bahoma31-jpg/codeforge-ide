/**
 * CodeForge IDE - File Tree Component
 * Agent 4: File System Manager
 * 
 * Displays the file/folder hierarchy with virtual scrolling for performance
 */

'use client';

import { useEffect, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useFilesStore } from '@/lib/stores/files-store';
import { FileTreeItem } from './file-tree-item';
import { Loader2 } from 'lucide-react';
import { initializeSampleFiles } from '@/lib/utils/initial-files';
import type { FileNode } from '@/lib/types/files';

// Flatten tree structure for virtual scrolling
function flattenTree(nodes: FileNode[], level = 0): Array<{ node: FileNode; level: number }> {
  const result: Array<{ node: FileNode; level: number }> = [];
  
  for (const node of nodes) {
    result.push({ node, level });
    
    // If folder is expanded, add children
    if (node.type === 'folder' && node.isExpanded && node.children) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  
  return result;
}

function FileTree() {
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

  // Memoize flattened tree for virtual scrolling
  const flattenedNodes = useMemo(
    () => flattenTree(rootNodes),
    [rootNodes]
  );

  // Row renderer for virtual list
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const { node, level } = flattenedNodes[index];
      return (
        <div style={style}>
          <FileTreeItem node={node} level={level} />
        </div>
      );
    },
    [flattenedNodes]
  );

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

  // Use virtual scrolling for large trees (>20 items)
  if (flattenedNodes.length > 20) {
    return (
      <div className="py-2">
        <List
          height={600}
          itemCount={flattenedNodes.length}
          itemSize={28}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </div>
    );
  }

  // Regular rendering for small trees
  return (
    <div className="py-2">
      {rootNodes.map((node) => (
        <FileTreeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}

// Export memoized component
export default memo(FileTree);
