'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { File, Plus, Minus, ChevronRight, ChevronDown } from 'lucide-react';

export default function ChangesList() {
  const { status, stagedFiles, addToStaging, removeFromStaging } = useGitStore();
  const { addTab } = useEditorStore();
  const [stagedExpanded, setStagedExpanded] = useState(true);
  const [changesExpanded, setChangesExpanded] = useState(true);

  const openFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() ?? filePath;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescriptreact',
      js: 'javascript',
      jsx: 'javascriptreact',
      json: 'json',
      css: 'css',
      html: 'html',
      md: 'markdown',
      py: 'python',
    };

    addTab({
      id: `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      filePath,
      fileName,
      language: languageMap[ext] || 'plaintext',
      content: '',
      isDirty: false,
      isActive: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'modified':
        return <span className="text-xs font-semibold text-yellow-500">M</span>;
      case 'added':
        return <span className="text-xs font-semibold text-green-500">A</span>;
      case 'deleted':
        return <span className="text-xs font-semibold text-red-500">D</span>;
      case 'renamed':
        return <span className="text-xs font-semibold text-blue-500">R</span>;
      default:
        return null;
    }
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const getFilePath = (path: string) => {
    const parts = path.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
  };

  const allChanges = [
    ...status.modified.map(path => ({ path, status: 'modified' })),
    ...status.added.map(path => ({ path, status: 'added' })),
    ...status.deleted.map(path => ({ path, status: 'deleted' })),
  ];

  const unstagedChanges = allChanges.filter(
    change => !stagedFiles.some(staged => staged.filePath === change.path)
  );

  const totalChanges = unstagedChanges.length + stagedFiles.length;

  if (totalChanges === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <File className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No changes detected</p>
        <p className="text-xs text-muted-foreground">Make changes to your files to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Staged Changes */}
      {stagedFiles.length > 0 && (
        <div>
          <button
            onClick={() => setStagedExpanded(!stagedExpanded)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              {stagedExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Staged Changes
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                {stagedFiles.length}
              </span>
            </div>
          </button>

          {stagedExpanded && (
            <div className="space-y-0.5 py-1">
              {stagedFiles.map((file) => (
                <div
                  key={file.filePath}
                  className="group flex items-center justify-between gap-2 px-2 py-1 hover:bg-secondary"
                >
                  <button
                    onClick={() => openFile(file.filePath)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(file.status)}
                        <span className="truncate text-sm">{getFileName(file.filePath)}</span>
                      </div>
                      {getFilePath(file.filePath) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {getFilePath(file.filePath)}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeFromStaging(file.filePath)}
                    className="flex-shrink-0 rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
                    title="Unstage"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unstaged Changes */}
      {unstagedChanges.length > 0 && (
        <div>
          <button
            onClick={() => setChangesExpanded(!changesExpanded)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              {changesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Changes
              </span>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium">
                {unstagedChanges.length}
              </span>
            </div>
          </button>

          {changesExpanded && (
            <div className="space-y-0.5 py-1">
              {unstagedChanges.map((change) => (
                <div
                  key={change.path}
                  className="group flex items-center justify-between gap-2 px-2 py-1 hover:bg-secondary"
                >
                  <button
                    onClick={() => openFile(change.path)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(change.status)}
                        <span className="truncate text-sm">{getFileName(change.path)}</span>
                      </div>
                      {getFilePath(change.path) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {getFilePath(change.path)}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => addToStaging(change.path)}
                    className="flex-shrink-0 rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
                    title="Stage"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
