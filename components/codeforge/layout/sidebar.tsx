'use client';

import { useMemo } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { ChevronRight, File, Folder } from 'lucide-react';

type SidebarProps = { width: number };

const explorerNodes = [
  {
    type: 'folder' as const,
    name: 'src',
    children: ['index.ts', 'app.tsx', 'styles.css'],
  },
  {
    type: 'folder' as const,
    name: 'public',
    children: ['favicon.ico'],
  },
  { type: 'file' as const, name: 'README.md' },
];

export default function Sidebar({ width }: SidebarProps) {
  const { activityBarView } = useUIStore();
  const { addTab } = useEditorStore();

  const title = useMemo(() => {
    switch (activityBarView) {
      case 'explorer':
        return 'Explorer';
      case 'search':
        return 'Search';
      case 'git':
        return 'Source Control';
      case 'extensions':
        return 'Extensions';
      case 'settings':
        return 'Settings';
      default:
        return 'Explorer';
    }
  }, [activityBarView]);

  const openFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() ?? filePath;
    addTab({
      id: `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      filePath,
      fileName,
      language: fileName.endsWith('.ts')
        ? 'typescript'
        : fileName.endsWith('.tsx')
          ? 'typescriptreact'
          : fileName.endsWith('.css')
            ? 'css'
            : 'plaintext',
      content: '',
      isDirty: false,
      isActive: true,
    });
  };

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
          <div className="space-y-2">
            {explorerNodes.map((node) => {
              if (node.type === 'file') {
                return (
                  <button
                    key={node.name}
                    onClick={() => openFile(`/${node.name}`)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-secondary"
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span>{node.name}</span>
                  </button>
                );
              }

              return (
                <div key={node.name} className="space-y-1">
                  <div className="flex items-center gap-2 rounded px-2 py-1 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                    <Folder className="h-4 w-4" />
                    <span>{node.name}/</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {node.children.map((child) => (
                      <button
                        key={child}
                        onClick={() => openFile(`/${node.name}/${child}`)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-secondary"
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span>{child}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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

        {activityBarView === 'extensions' && (
          <p className="text-sm text-muted-foreground">
            Extensions view placeholder.
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
