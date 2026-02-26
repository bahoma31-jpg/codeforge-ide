'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useFilesStore, getChildrenFromState } from '@/lib/stores/files-store';
import { ChevronRight, File, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/lib/db/schema';

type SidebarProps = { width: number };

export default function Sidebar({ width }: SidebarProps) {
  const { activityBarView } = useUIStore();
  const { openFile } = useEditorStore();
  const {
    rootNodes,
    expandedFolders,
    isLoading,
    isInitialized,
    initialize,
    toggleFolder,
  } = useFilesStore();

  // Initialize file system on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const title = useMemo(() => {
    switch (activityBarView) {
      case 'explorer':
        return 'Explorer';
      case 'search':
        return 'Search';
      case 'git':
        return 'Source Control';
      case 'terminal':
        return 'Terminal';
      case 'settings':
        return 'Settings';
      default:
        return 'Explorer';
    }
  }, [activityBarView]);

  const handleOpenFile = useCallback(
    (node: FileNode) => {
      openFile({
        id: node.id,
        name: node.name,
        content: node.content || '',
        language: node.language || 'plaintext',
        path: node.path,
      });
    },
    [openFile]
  );

  /** Render a single file/folder node recursively */
  const renderNode = useCallback(
    (node: FileNode, level: number = 0) => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders.has(node.id);
      const children = isFolder ? getChildrenFromState(node.id) : [];

      return (
        <div key={node.id}>
          <button
            onClick={() => {
              if (isFolder) {
                toggleFolder(node.id);
              } else {
                handleOpenFile(node);
              }
            }}
            className={cn(
              'flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm',
              'hover:bg-secondary transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {isFolder && (
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <File className="h-4 w-4 shrink-0 text-muted-foreground ml-[18px]" />
            )}
            <span className="truncate">{node.name}</span>
          </button>

          {isFolder && isExpanded && children.length > 0 && (
            <div>
              {children
                .sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === 'folder' ? -1 : 1;
                })
                .map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    },
    [expandedFolders, toggleFolder, handleOpenFile]
  );

  return (
    <aside
      style={{ width }}
      className="flex h-full flex-col border-r border-border bg-[hsl(var(--cf-sidebar))]"
    >
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activityBarView === 'explorer' && (
          <div className="space-y-0.5">
            {isLoading && !isInitialized ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rootNodes.length > 0 ? (
              rootNodes
                .sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === 'folder' ? -1 : 1;
                })
                .map((node) => renderNode(node))
            ) : (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No files yet. Create a new file to get started.
              </p>
            )}
          </div>
        )}

        {activityBarView === 'search' && (
          <p className="text-sm text-muted-foreground">
            Search UI will be implemented later.
          </p>
        )}

        {activityBarView === 'git' && (
          <p className="text-sm text-muted-foreground">
            Source Control placeholder (Agent 5 scope).
          </p>
        )}

        {activityBarView === 'terminal' && (
          <p className="text-sm text-muted-foreground">
            Terminal controls will appear here.
          </p>
        )}

        {activityBarView === 'settings' && (
          <p className="text-sm text-muted-foreground">
            Settings view placeholder.
          </p>
        )}
      </div>
    </aside>
  );
}
