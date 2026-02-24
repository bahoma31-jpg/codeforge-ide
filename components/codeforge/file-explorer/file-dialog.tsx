/**
 * CodeForge IDE - File Dialog
 * Agent 4: File System Manager
 * 
 * Dialog for creating/renaming files and folders
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFilesStore } from '@/lib/stores/files-store';
import type { FileNode } from '@/lib/db/schema';
import { detectLanguage } from '@/lib/utils/file-icons';

interface FileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'file' | 'folder' | 'rename';
  parentNode?: FileNode;
  nodeToRename?: FileNode;
}

export function FileDialog({
  open,
  onOpenChange,
  mode,
  parentNode,
  nodeToRename
}: FileDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createFile, createFolder, renameNode } = useFilesStore();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName(nodeToRename?.name || '');
      setError('');
      setIsSubmitting(false);
    }
  }, [open, nodeToRename]);

  // Get dialog title and description
  const getTitle = () => {
    switch (mode) {
      case 'file':
        return 'Create New File';
      case 'folder':
        return 'Create New Folder';
      case 'rename':
        return `Rename ${nodeToRename?.type === 'folder' ? 'Folder' : 'File'}`;
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'file':
        return 'Enter a name for the new file';
      case 'folder':
        return 'Enter a name for the new folder';
      case 'rename':
        return 'Enter a new name';
    }
  };

  // Validate name
  const validateName = (value: string): string | null => {
    if (!value.trim()) {
      return 'Name cannot be empty';
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F\/\\]/;
    if (invalidChars.test(value)) {
      return 'Name contains invalid characters';
    }

    // Check length
    if (value.length > 255) {
      return 'Name is too long (max 255 characters)';
    }

    return null;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'rename') {
        if (!nodeToRename) {
          throw new Error('No node to rename');
        }
        await renameNode(nodeToRename.id, name.trim());
      } else if (mode === 'file') {
        const parentId = parentNode?.id || null;
        const language = detectLanguage(name);
        await createFile(name.trim(), parentId, '', language);
      } else if (mode === 'folder') {
        const parentId = parentNode?.id || null;
        await createFolder(name.trim(), parentId);
      }

      // Success - close dialog
      onOpenChange(false);
      setName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === 'folder' ? 'folder-name' : 'filename.ext'}
                autoFocus
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : mode === 'rename' ? 'Rename' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
