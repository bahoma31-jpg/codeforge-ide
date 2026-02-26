/**
 * CodeForge IDE - Sidebar v2.0
 * Dynamic sidebar that switches content based on active view.
 * Now supports all 5 views: explorer, search, git, terminal, settings.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import type { FileNode } from '@/lib/db/schema';
import { FileContextMenu } from '@/components/codeforge/file-explorer/file-context-menu';
import { GitPanel } from '@/components/codeforge/panels/git-panel';
import { SettingsPanel } from '@/components/codeforge/panels/settings-panel';
import { SearchPanel } from '@/components/codeforge/panels/search-panel';
import { TerminalSidePanel } from '@/components/codeforge/panels/terminal-panel';

/**
 * Props — 'width' is accepted for compatibility with main-layout.tsx
 * but the actual width is controlled via inline style on the parent.
 */
interface SidebarProps {
  width?: number;
}

export default function Sidebar({ width }: SidebarProps) {
  const { sidebarVisible, activityBarView } = useUIStore();
  const { fileTree, isLoading, loadFileTree } = useFilesStore();
  const { openFile } = useEditorStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFileTree();
  }, [loadFileTree]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleFileClick = useCallback(
    (node: FileNode) => {
      if (node.type === 'file') {
        openFile({
          id: node.id,
          name: node.name,
          content: node.content || '',
          language: node.language || 'plaintext',
          path: node.path,
        });
      }
    },
    [openFile]
  );

  if (!sidebarVisible) return null;

  // ─── View titles ───
  const viewTitles: Record<string, string> = {
    explorer: 'المستكشف',
    search: 'البحث',
    git: 'التحكم بالمصدر',
    terminal: 'الطرفية',
    settings: 'الإعدادات',
  };

  // ─── Render sidebar content based on active view ───
  const renderContent = () => {
    switch (activityBarView) {
      case 'git':
        return <GitPanel />;

      case 'search':
        return <SearchPanel />;

      case 'terminal':
        return <TerminalSidePanel />;

      case 'settings':
        return <SettingsPanel />;

      case 'explorer':
      default:
        return renderExplorer();
    }
  };

  const renderExplorer = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!fileTree || fileTree.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد ملفات — افتح مجلداً أو استنسخ مستودعاً
          </p>
        </div>
      );
    }

    return (
      <div className="py-1">
        {sortNodes(fileTree).map((node) => renderNode(node, 0))}
      </div>
    );
  };

  const renderNode = (node: FileNode & { children?: FileNode[] }, depth: number): React.ReactNode => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.id);

    return (
      <FileContextMenu key={node.id} node={node}>
        <div>
          <button
            className={cn(
              'flex w-full items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => (isFolder ? toggleFolder(node.id) : handleFileClick(node))}
          >
            {isFolder ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {isFolder && <Folder className="h-4 w-4 shrink-0 text-blue-400" />}
            <span className="truncate text-left">{node.name}</span>
          </button>
          {isFolder && isExpanded && node.children && (
            <div>
              {sortNodes(node.children).map((child: FileNode & { children?: FileNode[] }) =>
                renderNode(child, depth + 1)
              )}
            </div>
          )}
        </div>
      </FileContextMenu>
    );
  };

  return (
    <div className="flex h-full flex-col border-r bg-[hsl(var(--cf-sidebar))]">
      <div className="border-b px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {viewTitles[activityBarView] || activityBarView}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}

/** Sort nodes: folders first, then alphabetically */
function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}
