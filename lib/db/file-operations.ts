/**
 * CodeForge IDE - File Operations API
 * Agent 4: File System Manager
 *
 * High-level file system operations using IndexedDB
 */

import { v4 as uuidv4 } from 'uuid';
import { getDBManager } from './indexeddb';
import type { FileNode } from './schema';
import {
  validateFileNode,
  isValidPath,
  getFileName,
  getParentPath,
  joinPath,
} from './schema';

/**
 * File system error types
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Create a new file
 */
export async function createFile(
  name: string,
  parentId: string | null,
  content: string = '',
  language?: string
): Promise<FileNode> {
  const db = getDBManager();

  // Get parent to construct path
  let path: string;
  if (parentId === null) {
    path = '/' + name;
  } else {
    const parent = await db.get<FileNode>(parentId);
    if (!parent) {
      throw new FileSystemError('Parent folder not found', 'PARENT_NOT_FOUND', {
        parentId,
      });
    }
    if (parent.type !== 'folder') {
      throw new FileSystemError('Parent must be a folder', 'INVALID_PARENT', {
        parentId,
      });
    }
    path = parent.path === '/' ? '/' + name : parent.path + '/' + name;
  }

  // Validate path
  if (!isValidPath(path)) {
    throw new FileSystemError('Invalid file path', 'INVALID_PATH', { path });
  }

  // Check if file already exists
  const existing = await db.getByIndex<FileNode>('path', path);
  if (existing) {
    throw new FileSystemError('File already exists', 'FILE_EXISTS', { path });
  }

  // Calculate size
  const size = new Blob([content]).size;

  // Create file node
  const file: FileNode = {
    id: uuidv4(),
    name,
    path,
    type: 'file',
    parentId,
    content,
    language,
    size,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  };

  // Validate before saving
  if (!validateFileNode(file)) {
    throw new FileSystemError('Invalid file node', 'VALIDATION_ERROR', {
      file,
    });
  }

  // Save to database
  await db.put(file);

  return file;
}

/**
 * Create a new folder
 */
export async function createFolder(
  name: string,
  parentId: string | null
): Promise<FileNode> {
  const db = getDBManager();

  // Get parent to construct path
  let path: string;
  if (parentId === null) {
    path = '/' + name;
  } else {
    const parent = await db.get<FileNode>(parentId);
    if (!parent) {
      throw new FileSystemError('Parent folder not found', 'PARENT_NOT_FOUND', {
        parentId,
      });
    }
    if (parent.type !== 'folder') {
      throw new FileSystemError('Parent must be a folder', 'INVALID_PARENT', {
        parentId,
      });
    }
    path = parent.path === '/' ? '/' + name : parent.path + '/' + name;
  }

  // Validate path
  if (!isValidPath(path)) {
    throw new FileSystemError('Invalid folder path', 'INVALID_PATH', { path });
  }

  // Check if folder already exists
  const existing = await db.getByIndex<FileNode>('path', path);
  if (existing) {
    throw new FileSystemError('Folder already exists', 'FOLDER_EXISTS', {
      path,
    });
  }

  // Create folder node
  const folder: FileNode = {
    id: uuidv4(),
    name,
    path,
    type: 'folder',
    parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      isExpanded: false,
    },
  };

  // Validate before saving
  if (!validateFileNode(folder)) {
    throw new FileSystemError('Invalid folder node', 'VALIDATION_ERROR', {
      folder,
    });
  }

  // Save to database
  await db.put(folder);

  return folder;
}

/**
 * Read a file by ID
 */
export async function readFile(id: string): Promise<FileNode> {
  const db = getDBManager();
  const file = await db.get<FileNode>(id);

  if (!file) {
    throw new FileSystemError('File not found', 'FILE_NOT_FOUND', { id });
  }

  return file;
}

/**
 * Read a file by path
 */
export async function readFileByPath(path: string): Promise<FileNode> {
  const db = getDBManager();
  const file = await db.getByIndex<FileNode>('path', path);

  if (!file) {
    throw new FileSystemError('File not found', 'FILE_NOT_FOUND', { path });
  }

  return file;
}

/**
 * Update a file
 */
export async function updateFile(
  id: string,
  updates: Partial<Omit<FileNode, 'id' | 'createdAt'>>
): Promise<FileNode> {
  const db = getDBManager();
  const file = await db.get<FileNode>(id);

  if (!file) {
    throw new FileSystemError('File not found', 'FILE_NOT_FOUND', { id });
  }

  // Calculate new size if content changed
  let size = file.size;
  if (updates.content !== undefined) {
    size = new Blob([updates.content]).size;
  }

  // Merge updates
  const updated: FileNode = {
    ...file,
    ...updates,
    size,
    updatedAt: Date.now(),
  };

  // Validate before saving
  if (!validateFileNode(updated)) {
    throw new FileSystemError(
      'Invalid file node after update',
      'VALIDATION_ERROR',
      { updated }
    );
  }

  // Save to database
  await db.put(updated);

  return updated;
}

/**
 * Delete a file or folder (and all children if folder)
 */
export async function deleteNode(id: string): Promise<void> {
  const db = getDBManager();
  const node = await db.get<FileNode>(id);

  if (!node) {
    throw new FileSystemError('Node not found', 'NODE_NOT_FOUND', { id });
  }

  // If it's a folder, delete all children recursively
  if (node.type === 'folder') {
    const children = await getChildren(id);
    for (const child of children) {
      await deleteNode(child.id);
    }
  }

  // Delete the node itself
  await db.delete(id);
}

/**
 * Rename a file or folder
 */
export async function renameNode(
  id: string,
  newName: string
): Promise<FileNode> {
  const db = getDBManager();
  const node = await db.get<FileNode>(id);

  if (!node) {
    throw new FileSystemError('Node not found', 'NODE_NOT_FOUND', { id });
  }

  // Construct new path
  const parentPath = getParentPath(node.path);
  const newPath =
    parentPath === null ? '/' + newName : joinPath(parentPath, newName);

  // Validate new path
  if (!isValidPath(newPath)) {
    throw new FileSystemError('Invalid new path', 'INVALID_PATH', { newPath });
  }

  // Check if new path already exists
  const existing = await db.getByIndex<FileNode>('path', newPath);
  if (existing && existing.id !== id) {
    throw new FileSystemError(
      'A file or folder with this name already exists',
      'NAME_CONFLICT',
      { newPath }
    );
  }

  // Update node
  const updated: FileNode = {
    ...node,
    name: newName,
    path: newPath,
    updatedAt: Date.now(),
  };

  await db.put(updated);

  // If it's a folder, update all children paths
  if (node.type === 'folder') {
    await updateChildrenPaths(node.path, newPath);
  }

  return updated;
}

/**
 * Move a file or folder to a new parent
 */
export async function moveNode(
  id: string,
  newParentId: string | null
): Promise<FileNode> {
  const db = getDBManager();
  const node = await db.get<FileNode>(id);

  if (!node) {
    throw new FileSystemError('Node not found', 'NODE_NOT_FOUND', { id });
  }

  // Get new parent
  let newPath: string;
  if (newParentId === null) {
    newPath = '/' + node.name;
  } else {
    const newParent = await db.get<FileNode>(newParentId);
    if (!newParent) {
      throw new FileSystemError('New parent not found', 'PARENT_NOT_FOUND', {
        newParentId,
      });
    }
    if (newParent.type !== 'folder') {
      throw new FileSystemError(
        'New parent must be a folder',
        'INVALID_PARENT',
        { newParentId }
      );
    }
    newPath =
      newParent.path === '/'
        ? '/' + node.name
        : newParent.path + '/' + node.name;
  }

  // Validate new path
  if (!isValidPath(newPath)) {
    throw new FileSystemError('Invalid new path', 'INVALID_PATH', { newPath });
  }

  // Check if new path already exists
  const existing = await db.getByIndex<FileNode>('path', newPath);
  if (existing && existing.id !== id) {
    throw new FileSystemError(
      'A file or folder with this name already exists in destination',
      'NAME_CONFLICT',
      { newPath }
    );
  }

  // Update node
  const updated: FileNode = {
    ...node,
    parentId: newParentId,
    path: newPath,
    updatedAt: Date.now(),
  };

  await db.put(updated);

  // If it's a folder, update all children paths
  if (node.type === 'folder') {
    await updateChildrenPaths(node.path, newPath);
  }

  return updated;
}

/**
 * Get children of a folder
 */
export async function getChildren(
  parentId: string | null
): Promise<FileNode[]> {
  const db = getDBManager();
  return db.getAllByIndex<FileNode>('parentId', parentId);
}

/**
 * Get all nodes in the file system
 */
export async function getAllNodes(): Promise<FileNode[]> {
  const db = getDBManager();
  return db.getAll<FileNode>();
}

/**
 * Get root nodes (parentId === null)
 */
export async function getRootNodes(): Promise<FileNode[]> {
  return getChildren(null);
}

/**
 * Update children paths recursively after parent rename/move
 */
async function updateChildrenPaths(
  oldParentPath: string,
  newParentPath: string
): Promise<void> {
  const db = getDBManager();
  const allNodes = await db.getAll<FileNode>();

  // Find all nodes that are descendants of the moved/renamed folder
  const descendants = allNodes.filter((node) =>
    node.path.startsWith(oldParentPath + '/')
  );

  // Update each descendant's path
  for (const node of descendants) {
    const relativePath = node.path.slice(oldParentPath.length);
    const newPath = newParentPath + relativePath;

    const updated: FileNode = {
      ...node,
      path: newPath,
      updatedAt: Date.now(),
    };

    await db.put(updated);
  }
}

/**
 * Search files by name (fuzzy search)
 */
export async function searchFiles(query: string): Promise<FileNode[]> {
  const db = getDBManager();
  const allNodes = await db.getAll<FileNode>();
  const lowerQuery = query.toLowerCase();

  return allNodes.filter((node) =>
    node.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get file tree structure
 */
export async function getFileTree(): Promise<FileNode[]> {
  const allNodes = await getAllNodes();
  return buildTree(allNodes);
}

/**
 * Build tree structure from flat array
 */
function buildTree(nodes: FileNode[]): FileNode[] {
  const nodeMap = new Map<string, FileNode & { children?: FileNode[] }>();
  const rootNodes: FileNode[] = [];

  // First pass: create map
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Second pass: build tree
  nodes.forEach((node) => {
    const nodeWithChildren = nodeMap.get(node.id)!;
    if (node.parentId === null) {
      rootNodes.push(nodeWithChildren);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.children) {
        parent.children.push(nodeWithChildren);
      }
    }
  });

  return rootNodes;
}

/**
 * Clear all files (useful for testing)
 */
export async function clearAllFiles(): Promise<void> {
  const db = getDBManager();
  await db.clear();
}
