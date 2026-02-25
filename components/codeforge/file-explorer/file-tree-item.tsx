'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeItemProps {
  name: string;
  path: string;
  type: 'file' | 'folder';
  level: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  children?: React.ReactNode;
  onToggle?: () => void;
  onSelect?: () => void;
  onOpen?: () => void;
  onFocus?: () => void;
  isFocused?: boolean;
  index: number;
  totalItems: number;
  onNavigate?: (
    direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end'
  ) => void;
}

export function FileTreeItem({
  name,
  // path is received but unused — keep in interface for future use
  path: _path,
  type,
  level,
  isExpanded = false,
  isSelected = false,
  children,
  onToggle,
  onSelect,
  onOpen,
  onFocus,
  isFocused = false,
  index,
  totalItems,
  onNavigate,
}: FileTreeItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const isFolder = type === 'folder';

  // Auto-focus when this item becomes focused
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        onNavigate?.('down');
        break;

      case 'ArrowUp':
        e.preventDefault();
        onNavigate?.('up');
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (isFolder) {
          if (!isExpanded) {
            onToggle?.();
          } else {
            // Move to first child
            onNavigate?.('down');
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (isFolder && isExpanded) {
          onToggle?.();
        } else {
          // Move to parent
          onNavigate?.('up');
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isFolder) {
          onToggle?.();
        } else {
          onOpen?.();
        }
        break;

      case ' ':
        e.preventDefault();
        onSelect?.();
        break;

      case 'Home':
        e.preventDefault();
        onNavigate?.('home');
        break;

      case 'End':
        e.preventDefault();
        onNavigate?.('end');
        break;

      default:
        break;
    }
  };

  const handleClick = () => {
    onFocus?.();
    if (isFolder) {
      onToggle?.();
    } else {
      onOpen?.();
    }
  };

  return (
    <div
      role="group"
      aria-label={`${type === 'folder' ? 'Folder' : 'File'}: ${name}`}
    >
      <div
        ref={itemRef}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={level}
        aria-posinset={index + 1}
        aria-setsize={totalItems}
        tabIndex={isFocused ? 0 : -1}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isSelected && 'bg-accent',
          isFocused && 'ring-2 ring-ring'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder && (
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'transform rotate-90'
            )}
            aria-hidden="true"
          />
        )}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Folder className="h-4 w-4" aria-hidden="true" />
          )
        ) : (
          <File className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="flex-1 truncate text-sm">{name}</span>
      </div>
      {isFolder && isExpanded && children && <div role="group">{children}</div>}
    </div>
  );
}
