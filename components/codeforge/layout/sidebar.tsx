/**
 * CodeForge IDE - Sidebar v3.0
 * Dynamic sidebar that switches content based on active view.
 * Supports all 5 views: explorer, search, git, terminal, settings.
 *
 * v3.0 — Added GitHub repo tree support.
 *   When a repo is loaded (via chat click), shows its file tree
 *   fetched from GitHub API. Clicking files opens them in the editor.
 *   Falls back to local IndexedDB tree when no GitHub repo is loaded.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  FolderGit2,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore, type RepoFileNode } from '@/lib/stores/editor-store';
import type { FileNode } from '@/lib/db/schema';
import { FileContextMenu } from '@/components/codeforge/file-explorer/file-context-menu';
import { GitPanel } from '@/components/codeforge/panels/git-panel';
import { SettingsPanel } from '@/components/codeforge/panels/settings-panel';
import { SearchPanel } from '@/components/codeforge/panels/search-panel';
import { TerminalSidePanel } from '@/components/codeforge/panels/terminal-panel';

interface SidebarProps {
  width?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Sidebar({ width }: SidebarProps) {
  const { sidebarVisible, activityBarView } = useUIStore();

  // Local files store (IndexedDB)
  const {
    rootNodes,
    isLoading: localLoading,
    initialize: initFiles,
  } = useFilesStore();
  const { openFile } = useEditorStore();

  // GitHub repo tree from editor store
  const currentRepo = useEditorStore((s) => s.currentRepo);
  const repoTree = useEditorStore((s) => s.repoTree);
  const repoTreeLoading = useEditorStore((s) => s.repoTreeLoading);
  const loadRepoTree = useEditorStore((s) => s.loadRepoTree);
  const loadRepoTreeChildren = useEditorStore((s) => s.loadRepoTreeChildren);
  const openRepoFile = useEditorStore((s) => s.openRepoFile);

  // Local state for expanded folders
  const [expandedLocal, setExpandedLocal] = useState<Set<string>>(new Set());
  const [expandedRepo, setExpandedRepo] = useState<Set<string>>(new Set());
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    initFiles();
  }, [initFiles]);

  // ─── Local folder toggle ───
  const toggleLocalFolder = useCallback((folderId: string) => {
    setExpandedLocal((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // ─── Repo folder toggle (with lazy loading) ───
  const toggleRepoFolder = useCallback(
    async (node: RepoFileNode) => {
      const path = node.path;

      // If not loaded yet, fetch children
      if (!node.childrenLoaded) {
        setLoadingDirs((prev) => new Set(prev).add(path));
        try {
          await loadRepoTreeChildren(path);
        } catch (e) {
          console.error('Failed to load:', path, e);
        }
        setLoadingDirs((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }

      setExpandedRepo((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    },
    [loadRepoTreeChildren]
  );

  // ─── Open file from local IndexedDB ───
  const handleLocalFileClick = useCallback(
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

  // ─── Open file from GitHub repo ───
  const handleRepoFileClick = useCallback(
    async (node: RepoFileNode) => {
      if (node.type === 'file') {
        await openRepoFile(node.path, node.name);
      }
    },
    [openRepoFile]
  );

  if (!sidebarVisible) return null;

  const viewTitles: Record<string, string> = {
    explorer: 'المستكشف',
    search: 'البحث',
    git: 'التحكم بالمصدر',
    terminal: 'الطرفية',
    settings: 'الإعدادات',
  };

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

  // ═══════════════════════════════════════════════════
  // EXPLORER VIEW — combines GitHub repo tree + local tree
  // ═══════════════════════════════════════════════════
  const renderExplorer = () => {
    return (
      <div className="flex flex-col h-full">
        {/* GitHub Repo Tree (if loaded) */}
        {currentRepo && renderGitHubRepoTree()}

        {/* Local File Tree (IndexedDB) */}
        {!currentRepo && renderLocalTree()}
      </div>
    );
  };

  // ─── GitHub Repo File Tree ───
  const renderGitHubRepoTree = () => {
    return (
      <div className="flex flex-col flex-1">
        {/* Repo header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-accent/30 border-b">
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span className="text-xs font-medium truncate text-foreground">
              {currentRepo!.owner}/{currentRepo!.repo}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() =>
                loadRepoTree(
                  currentRepo!.owner,
                  currentRepo!.repo,
                  currentRepo!.branch
                )
              }
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="تحديث"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                useEditorStore.setState({ currentRepo: null, repoTree: [] });
                setExpandedRepo(new Set());
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="إغلاق المستودع"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Tree content */}
        <div className="flex-1 overflow-y-auto py-1">
          {repoTreeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : repoTree.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              المستودع فارغ
            </div>
          ) : (
            repoTree.map((node) => renderRepoNode(node, 0))
          )}
        </div>
      </div>
    );
  };

  // ─── Render a single repo node ───
  const renderRepoNode = (
    node: RepoFileNode,
    depth: number
  ): React.ReactNode => {
    const isDir = node.type === 'dir';
    const isExpanded = expandedRepo.has(node.path);
    const isLoadingDir = loadingDirs.has(node.path);

    return (
      <div key={node.path}>
        <button
          className={cn(
            'flex w-full items-center gap-1 px-2 py-[3px] text-[13px] hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'transition-colors'
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (isDir) {
              toggleRepoFolder(node);
            } else {
              handleRepoFileClick(node);
            }
          }}
        >
          {/* Expand/collapse icon for dirs */}
          {isDir ? (
            isLoadingDir ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* File/folder icon */}
          {isDir ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-400" />
            )
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          {/* Name */}
          <span className="truncate text-left">{node.name}</span>
        </button>

        {/* Children */}
        {isDir && isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderRepoNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ─── Local file tree (IndexedDB, fallback) ───
  const renderLocalTree = () => {
    if (localLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!rootNodes || rootNodes.length === 0) {
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
        {sortNodes(rootNodes).map((node) => renderLocalNode(node, 0))}
      </div>
    );
  };

  const renderLocalNode = (
    node: FileNode & { children?: FileNode[] },
    depth: number
  ): React.ReactNode => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedLocal.has(node.id);

    return (
      <FileContextMenu key={node.id} node={node}>
        <div>
          <button
            className={cn(
              'flex w-full items-center gap-1 px-2 py-[3px] text-[13px] hover:bg-accent/50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() =>
              isFolder ? toggleLocalFolder(node.id) : handleLocalFileClick(node)
            }
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
              {sortNodes(node.children).map(
                (child: FileNode & { children?: FileNode[] }) =>
                  renderLocalNode(child, depth + 1)
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
