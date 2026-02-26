/**
 * CodeForge IDE — File System Tools (with Store Bridge)
 * Agent tools for local file operations.
 * All WRITE operations sync with File Explorer and Editor via store-bridge.
 * All READ operations use direct DB calls for speed.
 *
 * v2.0 — All tools renamed with fs_* prefix to avoid collision with
 *         github_* tools. Names now match System Prompt v2.0 exactly.
 *
 * 9 tools: fs_list_files, fs_read_file, fs_search_files, fs_create_file,
 *          fs_update_file, fs_create_folder, fs_delete_file, fs_rename_file,
 *          fs_move_file.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import {
  readFile as dbReadFile,
  getAllNodes as dbGetAllNodes,
  searchFiles as dbSearchFiles,
  getChildren as dbGetChildren,
  readFileByPath as dbReadFileByPath,
} from '@/lib/db/file-operations';
import type { FileNode } from '@/lib/db/schema';
import {
  refreshFileTree,
  refreshOpenFile,
  closeDeletedFileTab,
  expandParentFolder,
  sendNotification,
} from '../bridge';

// ─── Tool Definitions ─────────────────────────────────────────

export const fileTools: ToolDefinition[] = [
  {
    name: 'fs_list_files',
    description: 'List all files and folders in the local project workspace, or list children of a specific folder. Returns file tree with names, paths, types, and sizes.',
    parameters: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'ID of the parent folder. Omit or pass null to get root-level files.',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'filesystem',
  },
  {
    name: 'fs_read_file',
    description: 'Read the content of a local file by its ID or path. Returns the full file content, language, and metadata.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The UUID of the file to read.',
        },
        filePath: {
          type: 'string',
          description: 'The path of the file to read (alternative to fileId).',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'filesystem',
  },
  {
    name: 'fs_search_files',
    description: 'Search for files by name in the local project workspace. Returns matching files with their paths and types.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match against file names.',
        },
      },
      required: ['query'],
    },
    riskLevel: 'auto',
    category: 'filesystem',
  },
  {
    name: 'fs_create_file',
    description: 'Create a new file in the local workspace with the specified name, content, and language. The file appears immediately in the File Explorer.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'File name with extension (e.g., "index.ts", "styles.css").',
        },
        parentId: {
          type: 'string',
          description: 'ID of the parent folder. Null for root level.',
          nullable: true,
        },
        content: {
          type: 'string',
          description: 'Initial file content.',
        },
        language: {
          type: 'string',
          description: 'Programming language (e.g., "typescript", "javascript", "css").',
        },
      },
      required: ['name', 'content'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
  {
    name: 'fs_update_file',
    description: 'Update the content of an existing local file. The editor tab refreshes automatically if the file is open.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The UUID of the file to update.',
        },
        filePath: {
          type: 'string',
          description: 'The path of the file to update (alternative to fileId).',
        },
        newContent: {
          type: 'string',
          description: 'The new content to replace the file content with.',
        },
      },
      required: ['newContent'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
  {
    name: 'fs_create_folder',
    description: 'Create a new folder in the local project workspace. Appears immediately in the File Explorer.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Folder name.',
        },
        parentId: {
          type: 'string',
          description: 'ID of the parent folder. Null for root level.',
          nullable: true,
        },
      },
      required: ['name'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
  {
    name: 'fs_delete_file',
    description: 'Delete a local file or folder (and all its children). Closes the editor tab if open. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The UUID of the file or folder to delete.',
        },
      },
      required: ['nodeId'],
    },
    riskLevel: 'confirm',
    category: 'filesystem',
  },
  {
    name: 'fs_rename_file',
    description: 'Rename a local file or folder. Updates the File Explorer immediately.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The UUID of the file or folder to rename.',
        },
        newName: {
          type: 'string',
          description: 'The new name for the file or folder.',
        },
      },
      required: ['nodeId', 'newName'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
  {
    name: 'fs_move_file',
    description: 'Move a local file or folder to a different parent folder. Updates the File Explorer.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The UUID of the file or folder to move.',
        },
        newParentId: {
          type: 'string',
          description: 'The UUID of the new parent folder. Null for root level.',
          nullable: true,
        },
      },
      required: ['nodeId'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
];

// ─── Helper ───────────────────────────────────────────────────

function formatNode(node: FileNode): Record<string, unknown> {
  return {
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    language: node.language,
    size: node.size,
    updatedAt: new Date(node.updatedAt).toISOString(),
  };
}

// ─── Tool Executors (with Store Bridge) ───────────────────────

export function registerFileExecutors(service: AgentService): void {
  // ── READ OPERATIONS (direct DB — fast path) ─────────────

  // fs_list_files
  service.registerToolExecutor('fs_list_files', async (args) => {
    try {
      const parentId = (args.parentId as string) || null;
      let nodes: FileNode[];

      if (parentId) {
        nodes = await dbGetChildren(parentId);
      } else {
        nodes = await dbGetAllNodes();
      }

      return { success: true, data: nodes.map(formatNode) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_read_file
  service.registerToolExecutor('fs_read_file', async (args) => {
    try {
      let file: FileNode;
      if (args.fileId) {
        file = await dbReadFile(args.fileId as string);
      } else if (args.filePath) {
        file = await dbReadFileByPath(args.filePath as string);
      } else {
        return { success: false, error: 'Either fileId or filePath is required' };
      }

      return {
        success: true,
        data: { ...formatNode(file), content: file.content || '' },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_search_files
  service.registerToolExecutor('fs_search_files', async (args) => {
    try {
      const results = await dbSearchFiles(args.query as string);
      return { success: true, data: results.map(formatNode) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── WRITE OPERATIONS (via Files Store → auto-syncs UI) ──

  // fs_create_file — uses filesStore to auto-refresh File Explorer
  service.registerToolExecutor('fs_create_file', async (args) => {
    try {
      const { useFilesStore } = await import('@/lib/stores/files-store');
      const store = useFilesStore.getState();

      const file = await store.createFile(
        args.name as string,
        (args.parentId as string) || null,
        (args.content as string) || '',
        args.language as string | undefined
      );

      // Expand parent folder so the new file is visible
      await expandParentFolder((args.parentId as string) || null);

      // Notify user
      await sendNotification(`🤖 تم إنشاء ملف: ${file.name}`, 'success');

      return {
        success: true,
        data: formatNode(file),
        diff: {
          filePath: file.path,
          oldContent: '',
          newContent: file.content || '',
          type: 'create' as const,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_update_file — uses filesStore + refreshes open editor tab
  service.registerToolExecutor('fs_update_file', async (args) => {
    try {
      // Resolve file ID from path if needed
      let fileId = args.fileId as string;
      if (!fileId && args.filePath) {
        const file = await dbReadFileByPath(args.filePath as string);
        fileId = file.id;
      }
      if (!fileId) {
        return { success: false, error: 'Either fileId or filePath is required' };
      }

      // Read old content for diff
      const oldFile = await dbReadFile(fileId);
      const oldContent = oldFile.content || '';
      const newContent = args.newContent as string;

      // Update via filesStore (auto-syncs file tree)
      const { useFilesStore } = await import('@/lib/stores/files-store');
      const updated = await useFilesStore.getState().updateFile(fileId, {
        content: newContent,
      });

      // ★ KEY: Refresh the editor tab if this file is currently open
      await refreshOpenFile(fileId, newContent);

      // Notify user
      await sendNotification(`🤖 تم تحديث: ${updated.name}`, 'info');

      return {
        success: true,
        data: formatNode(updated),
        diff: {
          filePath: updated.path,
          oldContent,
          newContent,
          type: 'modify' as const,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_create_folder — uses filesStore to auto-refresh
  service.registerToolExecutor('fs_create_folder', async (args) => {
    try {
      const { useFilesStore } = await import('@/lib/stores/files-store');
      const store = useFilesStore.getState();

      const folder = await store.createFolder(
        args.name as string,
        (args.parentId as string) || null
      );

      await sendNotification(`🤖 تم إنشاء مجلد: ${folder.name}`, 'success');

      return { success: true, data: formatNode(folder) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_delete_file — uses filesStore + closes editor tab
  service.registerToolExecutor('fs_delete_file', async (args) => {
    try {
      const nodeId = args.nodeId as string;

      // Read file info before deleting (for diff)
      const node = await dbReadFile(nodeId);

      // Delete via filesStore (auto-refreshes tree)
      const { useFilesStore } = await import('@/lib/stores/files-store');
      await useFilesStore.getState().deleteNode(nodeId);

      // ★ KEY: Close the editor tab if this file was open
      await closeDeletedFileTab(nodeId);

      // Notify user
      await sendNotification(`🤖 تم حذف: ${node.name}`, 'warning');

      return {
        success: true,
        data: { deleted: formatNode(node) },
        diff: {
          filePath: node.path,
          oldContent: node.content || '',
          newContent: '',
          type: 'delete' as const,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_rename_file — uses filesStore to auto-refresh
  service.registerToolExecutor('fs_rename_file', async (args) => {
    try {
      const { useFilesStore } = await import('@/lib/stores/files-store');
      const renamed = await useFilesStore.getState().renameNode(
        args.nodeId as string,
        args.newName as string
      );

      await sendNotification(`🤖 تمت إعادة التسمية إلى: ${renamed.name}`, 'info');

      return { success: true, data: formatNode(renamed) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // fs_move_file — uses filesStore to auto-refresh
  service.registerToolExecutor('fs_move_file', async (args) => {
    try {
      const { useFilesStore } = await import('@/lib/stores/files-store');
      const moved = await useFilesStore.getState().moveNode(
        args.nodeId as string,
        (args.newParentId as string) || null
      );

      await sendNotification(`🤖 تم نقل: ${moved.name}`, 'info');

      return { success: true, data: formatNode(moved) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
