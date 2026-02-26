/**
 * CodeForge IDE — File System Tools
 * Agent tools for local file operations (IndexedDB).
 * 9 tools: list, read, search, create, update, createFolder, delete, rename, move.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import {
  createFile as dbCreateFile,
  createFolder as dbCreateFolder,
  readFile as dbReadFile,
  updateFile as dbUpdateFile,
  deleteNode as dbDeleteNode,
  renameNode as dbRenameNode,
  moveNode as dbMoveNode,
  getAllNodes as dbGetAllNodes,
  searchFiles as dbSearchFiles,
  getChildren as dbGetChildren,
  readFileByPath as dbReadFileByPath,
} from '@/lib/db/file-operations';
import type { FileNode } from '@/lib/db/schema';

// ─── Tool Definitions ─────────────────────────────────────────

export const fileTools: ToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List all files and folders in the project, or list children of a specific folder. Returns file tree with names, paths, types, and sizes.',
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
    name: 'read_file',
    description: 'Read the content of a file by its ID or path. Returns the full file content, language, and metadata.',
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
    name: 'search_files',
    description: 'Search for files by name. Returns matching files with their paths and types.',
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
    name: 'create_file',
    description: 'Create a new file with the specified name, content, and language. The file is created in the specified parent folder.',
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
    name: 'update_file',
    description: 'Update the content of an existing file. Shows a diff of the changes.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The UUID of the file to update.',
        },
        newContent: {
          type: 'string',
          description: 'The new content to replace the file content with.',
        },
      },
      required: ['fileId', 'newContent'],
    },
    riskLevel: 'notify',
    category: 'filesystem',
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in the project.',
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
    name: 'delete_file',
    description: 'Delete a file or folder (and all its children if folder). This is a destructive operation that requires user confirmation.',
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
    name: 'rename_file',
    description: 'Rename a file or folder.',
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
    name: 'move_file',
    description: 'Move a file or folder to a different parent folder.',
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

// ─── Tool Executors ───────────────────────────────────────────

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

export function registerFileExecutors(service: AgentService): void {
  // list_files
  service.registerToolExecutor('list_files', async (args) => {
    try {
      const parentId = (args.parentId as string) || null;
      let nodes: FileNode[];

      if (parentId) {
        nodes = await dbGetChildren(parentId);
      } else {
        nodes = await dbGetAllNodes();
      }

      const formatted = nodes.map(formatNode);
      return { success: true, data: formatted };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // read_file
  service.registerToolExecutor('read_file', async (args) => {
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
        data: {
          ...formatNode(file),
          content: file.content || '',
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // search_files
  service.registerToolExecutor('search_files', async (args) => {
    try {
      const results = await dbSearchFiles(args.query as string);
      return { success: true, data: results.map(formatNode) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // create_file
  service.registerToolExecutor('create_file', async (args) => {
    try {
      const file = await dbCreateFile(
        args.name as string,
        (args.parentId as string) || null,
        (args.content as string) || '',
        args.language as string | undefined
      );
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

  // update_file
  service.registerToolExecutor('update_file', async (args) => {
    try {
      const oldFile = await dbReadFile(args.fileId as string);
      const oldContent = oldFile.content || '';
      const newContent = args.newContent as string;

      const updated = await dbUpdateFile(args.fileId as string, {
        content: newContent,
      });

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

  // create_folder
  service.registerToolExecutor('create_folder', async (args) => {
    try {
      const folder = await dbCreateFolder(
        args.name as string,
        (args.parentId as string) || null
      );
      return { success: true, data: formatNode(folder) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // delete_file
  service.registerToolExecutor('delete_file', async (args) => {
    try {
      const node = await dbReadFile(args.nodeId as string);
      await dbDeleteNode(args.nodeId as string);
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

  // rename_file
  service.registerToolExecutor('rename_file', async (args) => {
    try {
      const renamed = await dbRenameNode(
        args.nodeId as string,
        args.newName as string
      );
      return {
        success: true,
        data: formatNode(renamed),
        diff: {
          filePath: renamed.path,
          oldContent: '',
          newContent: '',
          type: 'rename' as const,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // move_file
  service.registerToolExecutor('move_file', async (args) => {
    try {
      const moved = await dbMoveNode(
        args.nodeId as string,
        (args.newParentId as string) || null
      );
      return {
        success: true,
        data: formatNode(moved),
        diff: {
          filePath: moved.path,
          oldContent: '',
          newContent: '',
          type: 'move' as const,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
