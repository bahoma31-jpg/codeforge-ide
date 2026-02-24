export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  updatedAt: number;
}

export interface FileMetadata {
  size: number;
  encoding: string;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
}

export type FileOperation = 'create' | 'read' | 'update' | 'delete';

export interface FileSystemState {
  rootNode: FileNode | null;
  activeFile: FileNode | null;
  expandedFolders: Set<string>;
}
