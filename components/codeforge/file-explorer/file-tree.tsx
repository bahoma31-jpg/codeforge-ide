'use client';

/**
 * CodeForge IDE — File Tree
 * Renders a navigable, accessible file/folder tree.
 *
 * FIX v2: Eliminated double-render of children in renderTree().
 * Previously, children were rendered TWICE for expanded folders:
 *   1. As `children` prop inside <FileTreeItem>
 *   2. Again after the item just to advance `currentIndex`
 * Now: single call, both elements and nextIndex come from one result.
 */

import { useState, useCallback } from 'react';
import { FileTreeItem } from './file-tree-item';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileOpen?: (path: string) => void;
}

export function FileTree({ files, onFileOpen }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Flatten visible tree for keyboard navigation index tracking
  const flattenTree = useCallback(
    (nodes: FileNode[], level = 0): Array<FileNode & { level: number }> => {
      const result: Array<FileNode & { level: number }> = [];

      for (const node of nodes) {
        result.push({ ...node, level });

        if (
          node.type === 'folder' &&
          expandedFolders.has(node.path) &&
          node.children
        ) {
          result.push(...flattenTree(node.children, level + 1));
        }
      }

      return result;
    },
    [expandedFolders]
  );

  const flatFiles = flattenTree(files);

  const handleToggle = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => {
      setFocusedIndex((prev) => {
        switch (direction) {
          case 'up':
            return Math.max(0, prev - 1);
          case 'down':
            return Math.min(flatFiles.length - 1, prev + 1);
          case 'home':
            return 0;
          case 'end':
            return flatFiles.length - 1;
          default:
            return prev;
        }
      });
    },
    [flatFiles.length]
  );

  /**
   * Render tree nodes recursively.
   *
   * Returns { elements, nextIndex } where:
   *  - elements: React nodes to render
   *  - nextIndex: the flat-list index after all rendered nodes
   *
   * KEY FIX: For expanded folders, we call renderTree() ONCE
   * and use the result for BOTH the children prop AND the index advance.
   */
  const renderTree = (
    nodes: FileNode[],
    level = 0,
    startIndex = 0
  ): { elements: React.ReactNode[]; nextIndex: number } => {
    let currentIndex = startIndex;
    const elements: React.ReactNode[] = [];

    for (const node of nodes) {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedPath === node.path;
      const isFocused = focusedIndex === currentIndex;
      const nodeIndex = currentIndex;

      // Advance index for this node itself
      currentIndex++;

      // If folder is expanded and has children, render them ONCE
      let childElements: React.ReactNode[] | null = null;
      if (node.type === 'folder' && isExpanded && node.children) {
        const childResult = renderTree(node.children, level + 1, currentIndex);
        childElements = childResult.elements;
        currentIndex = childResult.nextIndex; // advance past all children
      }

      elements.push(
        <FileTreeItem
          key={node.path}
          name={node.name}
          path={node.path}
          type={node.type}
          level={level}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isFocused={isFocused}
          index={nodeIndex}
          totalItems={flatFiles.length}
          onToggle={() => handleToggle(node.path)}
          onSelect={() => setSelectedPath(node.path)}
          onOpen={() => {
            if (node.type === 'file') {
              onFileOpen?.(node.path);
            }
          }}
          onFocus={() => setFocusedIndex(nodeIndex)}
          onNavigate={handleNavigate}
        >
          {childElements}
        </FileTreeItem>
      );
    }

    return { elements, nextIndex: currentIndex };
  };

  if (!files || files.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        لا توجد ملفات
      </div>
    );
  }

  return (
    <div
      role="tree"
      aria-label="File Explorer"
      aria-multiselectable="false"
      className="py-2 select-none"
    >
      {renderTree(files, 0, 0).elements}
    </div>
  );
}
