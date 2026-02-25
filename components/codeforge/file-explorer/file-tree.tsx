'use client';

import { useState } from 'react';
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Flatten tree for navigation
  const flattenTree = (nodes: FileNode[], level = 0): Array<FileNode & { level: number }> => {
    let result: Array<FileNode & { level: number }> = [];
    
    for (const node of nodes) {
      result.push({ ...node, level });
      
      if (node.type === 'folder' && expandedFolders.has(node.path) && node.children) {
        result = result.concat(flattenTree(node.children, level + 1));
      }
    }
    
    return result;
  };

  const flatFiles = flattenTree(files);

  const handleToggle = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleNavigate = (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => {
    let newIndex = focusedIndex;

    switch (direction) {
      case 'up':
        newIndex = Math.max(0, focusedIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(flatFiles.length - 1, focusedIndex + 1);
        break;
      case 'home':
        newIndex = 0;
        break;
      case 'end':
        newIndex = flatFiles.length - 1;
        break;
      default:
        break;
    }

    setFocusedIndex(newIndex);
  };

  const renderTree = (nodes: FileNode[], level = 0, startIndex = 0): { elements: React.ReactNode[], nextIndex: number } => {
    let currentIndex = startIndex;
    const elements: React.ReactNode[] = [];

    for (const node of nodes) {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedPath === node.path;
      const isFocused = focusedIndex === currentIndex;
      const nodeIndex = currentIndex;
      
      currentIndex++;

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
          {node.type === 'folder' && isExpanded && node.children ? (
            renderTree(node.children, level + 1, currentIndex).elements
          ) : null}
        </FileTreeItem>
      );

      if (node.type === 'folder' && isExpanded && node.children) {
        const result = renderTree(node.children, level + 1, currentIndex);
        currentIndex = result.nextIndex;
      }
    }

    return { elements, nextIndex: currentIndex };
  };

  return (
    <div
      role="tree"
      aria-label="File Explorer"
      aria-multiselectable="false"
      className="py-2"
    >
      {renderTree(files, 0, 0).elements}
    </div>
  );
}
