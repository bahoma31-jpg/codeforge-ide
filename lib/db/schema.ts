/**
 * CodeForge IDE - IndexedDB Database Schema
 * Agent 4: File System Manager
 * 
 * This file defines the structure of the IndexedDB database
 * for the local file system.
 */

export const DB_NAME = 'codeforge-fs';
export const DB_VERSION = 1;
export const STORE_NAME = 'files';

/**
 * FileNode represents a file or folder in the file system
 */
export interface FileNode {
  id: string;              // UUID
  name: string;            // "index.ts"
  path: string;            // "/src/index.ts"
  type: 'file' | 'folder';
  parentId: string | null; // null for root
  content?: string;        // File content (files only)
  language?: string;       // "typescript", "javascript"...
  size?: number;           // In bytes
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
  metadata?: FileMetadata;
}

/**
 * FileMetadata contains additional information about files/folders
 */
export interface FileMetadata {
  readOnly?: boolean;
  isExpanded?: boolean;  // For folders
  icon?: string;
  encoding?: string;     // "utf-8", "base64"...
}

/**
 * Database Schema Configuration
 */
export interface DBSchema {
  version: number;
  stores: StoreSchema[];
}

export interface StoreSchema {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes: IndexSchema[];
}

export interface IndexSchema {
  name: string;
  keyPath: string | string[];
  options?: {
    unique?: boolean;
    multiEntry?: boolean;
  };
}

/**
 * Main database schema
 */
export const dbSchema: DBSchema = {
  version: DB_VERSION,
  stores: [
    {
      name: STORE_NAME,
      keyPath: 'id',
      indexes: [
        {
          name: 'path',
          keyPath: 'path',
          options: { unique: true }
        },
        {
          name: 'parentId',
          keyPath: 'parentId',
          options: { unique: false }
        },
        {
          name: 'type',
          keyPath: 'type',
          options: { unique: false }
        },
        {
          name: 'name',
          keyPath: 'name',
          options: { unique: false }
        }
      ]
    }
  ]
};

/**
 * Migration system for database upgrades
 */
export type MigrationFunction = (db: IDBDatabase, transaction: IDBTransaction) => void;

export const migrations: Record<number, MigrationFunction> = {
  1: (db: IDBDatabase) => {
    // Create files object store
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    
    // Create indexes
    store.createIndex('path', 'path', { unique: true });
    store.createIndex('parentId', 'parentId', { unique: false });
    store.createIndex('type', 'type', { unique: false });
    store.createIndex('name', 'name', { unique: false });
  }
};

/**
 * Helper function to validate FileNode
 */
export function validateFileNode(node: Partial<FileNode>): node is FileNode {
  return (
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    typeof node.path === 'string' &&
    (node.type === 'file' || node.type === 'folder') &&
    (node.parentId === null || typeof node.parentId === 'string') &&
    typeof node.createdAt === 'number' &&
    typeof node.updatedAt === 'number'
  );
}

/**
 * Helper to check if path is valid
 */
export function isValidPath(path: string): boolean {
  // Path must start with /
  if (!path.startsWith('/')) return false;
  
  // Path cannot end with / unless it's root
  if (path !== '/' && path.endsWith('/')) return false;
  
  // Path cannot contain double slashes
  if (path.includes('//')) return false;
  
  // Path cannot contain invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  if (invalidChars.test(path)) return false;
  
  return true;
}

/**
 * Helper to extract filename from path
 */
export function getFileName(path: string): string {
  if (path === '/') return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
}

/**
 * Helper to get parent path
 */
export function getParentPath(path: string): string | null {
  if (path === '/') return null;
  const parts = path.split('/');
  parts.pop();
  return parts.length === 1 ? '/' : parts.join('/');
}

/**
 * Helper to join paths
 */
export function joinPath(...parts: string[]): string {
  const joined = parts
    .filter(p => p && p !== '/')
    .join('/')
    .replace(/\/+/g, '/');
  
  return '/' + joined;
}
