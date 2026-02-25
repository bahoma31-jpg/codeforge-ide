export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
  isOpen?: boolean;
  isRenaming?: boolean;
  parentId?: string;
}

export interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'move';
  path: string;
  newPath?: string;
  content?: string;
  timestamp: number;
}

export type FileTreeAction =
  | { type: 'CREATE_FILE'; payload: { parentPath: string; name: string } }
  | { type: 'CREATE_FOLDER'; payload: { parentPath: string; name: string } }
  | { type: 'DELETE'; payload: { path: string } }
  | { type: 'RENAME'; payload: { path: string; newName: string } };
