/**
 * CodeForge IDE - File Tree Item Component
 * Agent 4: File System Manager
 * 
 * Represents a single file or folder node in the tree
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilesStore, getChildrenFromState } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import type { FileNode } from '@/lib/db/schema';
import { getFileTypeConfig, getFolderTypeConfig } from '@/lib/utils/file-icons';
import { FileContextMenu } from './file-context-menu';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
}

export function FileTreeItem({ node, level }: FileTreeItemProps) {
  const { expandedFolders, toggleFolder, setSelectedFile, selectedFileId, getChildren } = useFilesStore();
  const { openFile, activeTabId } = useEditorStore();
  const [children, setChildren] = useState<FileNode[]>([]);
  
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFileId === node.id;
  const isActive = activeTabId === node.id;
  const isFolder = node.type === 'folder';

  // Load children when expanded
  useEffect(() => {
    if (isFolder && isExpanded) {
      // First try to get from state (faster)
      const stateChildren = getChildrenFromState(node.id);
      if (stateChildren.length > 0) {
        setChildren(stateChildren);
      } else {
        // Fallback to database query
        getChildren(node.id).then(setChildren).catch(console.error);
      }
    }
  }, [isExpanded, isFolder, node.id, getChildren]);

  // Handle click
  const handleClick = async () => {
    setSelectedFile(node.id);

    if (isFolder) {
      // Toggle folder
      toggleFolder(node.id);
    } else {
      // Open file in editor
      try {
        openFile({
          id: node.id,
          name: node.name,
          content: node.content || '',
          language: node.language,
          path: node.path
        });
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    }
  };

  // Get icon config
  const iconConfig = isFolder 
    ? getFolderTypeConfig(isExpanded)
    : getFileTypeConfig(node.name);
  
  const Icon = iconConfig.icon;
  const iconColor = iconConfig.color;

  // Calculate indent
  const indent = level * 16;

  return (
    <div>
      <FileContextMenu node={node}>
        <div
          onClick={handleClick}
          className={cn(
            'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 group',
            'transition-colors duration-150',
            isSelected && 'bg-accent',
            isActive && 'bg-accent/70 border-l-2 border-primary'
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {/* Expand/collapse chevron for folders */}
          {isFolder && (
            <div className="flex-shrink-0 w-4 h-4">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          )}
          
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={cn('w-4 h-4', iconConfig.color)} />
          </div>
          
          {/* Name */}
          <span className={cn(
            'text-sm truncate flex-1',
            isActive ? 'font-medium' : 'font-normal'
          )}>
            {node.name}
          </span>
        </div>
      </FileContextMenu>

      {/* Children */}
      {isFolder && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
