/**
 * CodeForge IDE - File Context Menu
 * Agent 4: File System Manager
 *
 * Right-click context menu for files and folders
 */

'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  Copy,
  FileText,
} from 'lucide-react';
import type { FileNode } from '@/lib/db/schema';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { FileDialog } from './file-dialog';

interface FileContextMenuProps {
  node: FileNode;
  children: React.ReactNode;
}

export function FileContextMenu({ node, children }: FileContextMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'file' | 'folder' | 'rename'>(
    'file'
  );
  const { deleteNode } = useFilesStore();
  const { openFile } = useEditorStore();
  const { addNotification } = useNotificationStore();
  const isFolder = node.type === 'folder';

  const handleNewFile = () => {
    setDialogMode('file');
    setDialogOpen(true);
  };

  const handleNewFolder = () => {
    setDialogMode('folder');
    setDialogOpen(true);
  };

  const handleRename = () => {
    setDialogMode('rename');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    const confirmMessage = isFolder
      ? `Delete folder "${node.name}" and all its contents?`
      : `Delete file "${node.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteNode(node.id);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
    addNotification({
      type: 'success',
      title: 'Path Copied',
      message: `Copied: ${node.path}`,
      autoDismiss: true,
      dismissAfterMs: 2000,
    });
  };

  const handleViewFile = () => {
    if (node.type === 'file') {
      openFile({
        id: node.id,
        name: node.name,
        content: node.content || '',
        language: node.language || 'plaintext',
        path: node.path,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div onContextMenu={(e) => e.preventDefault()}>{children}</div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56">
          {/* New File/Folder - only for folders */}
          {isFolder && (
            <>
              <DropdownMenuItem onClick={handleNewFile}>
                <FilePlus className="mr-2 h-4 w-4" />
                <span>New File</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleNewFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>New Folder</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {/* View File — opens in editor */}
          {!isFolder && (
            <>
              <DropdownMenuItem onClick={handleViewFile}>
                <FileText className="mr-2 h-4 w-4" />
                <span>View File</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {/* Rename */}
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>

          {/* Copy Path */}
          <DropdownMenuItem onClick={handleCopyPath}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Path</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* File Dialog */}
      <FileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        parentNode={dialogMode === 'rename' ? undefined : node}
        nodeToRename={dialogMode === 'rename' ? node : undefined}
      />
    </>
  );
}
