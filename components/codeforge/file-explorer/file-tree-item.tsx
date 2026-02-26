'use client';

/**
 * CodeForge IDE — File Tree Item
 * Single item (file or folder) in the file tree.
 * Fully accessible with ARIA tree roles and keyboard navigation.
 *
 * FIX v2: Cleaned up HTML structure — removed extra wrapper div,
 * fixed aria attributes for proper screen reader tree traversal.
 */

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
  path,
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
  const hasChildren = isFolder && isExpanded && children;

  // Auto-focus when this item becomes the focused item
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus({ preventScroll: false });
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
            onNavigate?.('down');
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (isFolder && isExpanded) {
          onToggle?.();
        } else {
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
    <>
      {/* Tree item row */}
      <div
        ref={itemRef}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={level + 1}
        aria-posinset={index + 1}
        aria-setsize={totalItems}
        aria-label={`${isFolder ? 'مجلد' : 'ملف'}: ${name}`}
        aria-owns={hasChildren ? `tree-group-${path}` : undefined}
        tabIndex={isFocused ? 0 : -1}
        data-path={path}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm',
          'transition-colors duration-100',
          'hover:bg-accent/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isSelected && 'bg-accent text-accent-foreground',
          isFocused && !isSelected && 'bg-accent/30'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Chevron (folders only) */}
        {isFolder && (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
              isExpanded && 'rotate-90'
            )}
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen
              className="h-4 w-4 shrink-0 text-blue-400"
              aria-hidden="true"
            />
          ) : (
            <Folder
              className="h-4 w-4 shrink-0 text-blue-400"
              aria-hidden="true"
            />
          )
        ) : (
          <File
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}

        {/* Name */}
        <span className="flex-1 truncate text-sm leading-tight">{name}</span>
      </div>

      {/* Children (expanded folder contents) */}
      {hasChildren && (
        <div role="group" id={`tree-group-${path}`}>
          {children}
        </div>
      )}
    </>
  );
}
