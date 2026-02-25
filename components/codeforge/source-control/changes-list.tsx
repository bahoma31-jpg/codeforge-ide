'use client';

import { useState } from 'react';
import { useGitStore } from '@/lib/stores/git-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { File, ChevronRight, ChevronDown, Plus, Minus } from 'lucide-react';

type FileStatus = 'M' | 'A' | 'D';

interface FileChange {
  path: string;
  status: FileStatus;
}

export default function ChangesList() {
  const { stagedFiles, modifiedFiles, addToStaging, removeFromStaging } = useGitStore();
  const { addTab } = useEditorStore();
  
  const [stagedCollapsed, setStagedCollapsed] = useState(false);
  const [changesCollapsed, setChangesCollapsed] = useState(false);

  const getFileName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'M': return 'text-yellow-500';
      case 'A': return 'text-green-500';
      case 'D': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const handleFileClick = (path: string) => {
    addTab({
      id: path,
      title: getFileName(path),
      content: '',
      language: path.split('.').pop() || 'plaintext',
      path,
    });
  };

  const renderFileItem = (file: FileChange, isStaged: boolean) => (
    <div
      key={file.path}
      className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary cursor-pointer"
    >
      <File className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0" onClick={() => handleFileClick(file.path)}>
        <p className="text-sm truncate">{getFileName(file.path)}</p>
        <p className="text-xs text-muted-foreground truncate">{file.path}</p>
      </div>
      <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${getStatusColor(file.status)} bg-current/10 flex-shrink-0`}>
        {file.status}
      </span>
      {isStaged ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromStaging(file.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Unstage"
        >
          <Minus className="w-3 h-3" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToStaging(file.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Stage"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const noChanges = stagedFiles.length === 0 && modifiedFiles.length === 0;

  if (noChanges) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No changes detected</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {stagedFiles.length > 0 && (
        <div className="border-b border-border">
          <button
            onClick={() => setStagedCollapsed(!stagedCollapsed)}
            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-secondary text-xs font-semibold uppercase tracking-wide"
          >
            {stagedCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>Staged Changes</span>
            <span className="ml-auto text-muted-foreground">{stagedFiles.length}</span>
          </button>
          {!stagedCollapsed && (
            <div className="pb-2">
              {stagedFiles.map((file) => renderFileItem(file, true))}
            </div>
          )}
        </div>
      )}

      {modifiedFiles.length > 0 && (
        <div>
          <button
            onClick={() => setChangesCollapsed(!changesCollapsed)}
            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-secondary text-xs font-semibold uppercase tracking-wide"
          >
            {changesCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>Changes</span>
            <span className="ml-auto text-muted-foreground">{modifiedFiles.length}</span>
          </button>
          {!changesCollapsed && (
            <div className="pb-2">
              {modifiedFiles.map((file) => renderFileItem(file, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
