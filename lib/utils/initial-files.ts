/**
 * CodeForge IDE - Initial Sample Files
 * Agent 4: File System Manager
 *
 * Creates sample files on first run
 */

import { createFile, createFolder, getAllNodes } from '../db/file-operations';
import { detectLanguage } from './file-icons';

/**
 * Sample file definition
 */
interface SampleFile {
  path: string;
  content: string;
  type: 'file' | 'folder';
}

/**
 * Initial sample files structure
 */
const sampleFiles: SampleFile[] = [
  // Root README
  {
    path: '/README.md',
    type: 'file',
    content: `# Welcome to CodeForge IDE! 🚀

CodeForge is a modern, web-based code editor inspired by VS Code.

## Features

- 📝 **Monaco Editor** - Full-featured code editing
- 🗂️ **File System** - Local file management with IndexedDB
- 🎨 **Beautiful UI** - Clean, modern interface
- ⚡ **Fast & Responsive** - Built with Next.js and React

## Getting Started

1. Create files and folders using the explorer sidebar
2. Click on files to open them in the editor
3. Your changes are automatically saved

## Sample Files

Explore the sample files in the \`src\` directory to see CodeForge in action!

Happy coding! 💻
`,
  },

  // src folder
  {
    path: '/src',
    type: 'folder',
    content: '',
  },

  // src/index.ts
  {
    path: '/src/index.ts',
    type: 'file',
    content: `/**
 * CodeForge IDE - Sample TypeScript File
 * 
 * This is a sample TypeScript file to demonstrate
 * the editor's features and syntax highlighting.
 */

import { formatDate, capitalize } from './utils';
import type { User } from './types';

// Sample user data
const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
};

// Greet user function
function greetUser(user: User): string {
  const formattedName = capitalize(user.name);
  const formattedDate = formatDate(user.createdAt);
  
  return \`Hello, \${formattedName}! Welcome to CodeForge IDE. Account created: \${formattedDate}\`;
}

// Main execution
console.log('🚀 CodeForge IDE is running!');
console.log(greetUser(user));

// Export for testing
export { greetUser };
`,
  },

  // src/utils.ts
  {
    path: '/src/utils.ts',
    type: 'file',
    content: `/**
 * Utility functions for CodeForge IDE
 */

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
`,
  },

  // src/types.ts
  {
    path: '/src/types.ts',
    type: 'file',
    content: `/**
 * Type definitions for CodeForge IDE
 */

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  avatar?: string;
  bio?: string;
}

/**
 * Project interface
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  size: number;
  mimeType: string;
  encoding: string;
  lastModified: Date;
}

/**
 * Editor theme type
 */
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black';

/**
 * Language type
 */
export type Language = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'cpp'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown';

/**
 * Result type for async operations
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
`,
  },

  // components folder
  {
    path: '/components',
    type: 'folder',
    content: '',
  },

  // components/Button.tsx
  {
    path: '/components/Button.tsx',
    type: 'file',
    content: `/**
 * Sample React Component - Button
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseStyles} \${variantStyles[variant]} \${disabledStyles}\`}
    >
      {children}
    </button>
  );
}
`,
  },
];

/**
 * Initialize sample files if database is empty
 */
export async function initializeSampleFiles(): Promise<boolean> {
  try {
    // Check if files already exist
    const existingNodes = await getAllNodes();
    if (existingNodes.length > 0) {
      console.log('Files already exist, skipping initialization');
      return false;
    }

    console.log('Creating initial sample files...');

    // Create folders first
    const folders = sampleFiles.filter((f) => f.type === 'folder');
    for (const folder of folders) {
      const name = folder.path.split('/').filter(Boolean).pop()!;
      await createFolder(name, null);
      console.log(`Created folder: ${folder.path}`);
    }

    // Then create files
    const files = sampleFiles.filter((f) => f.type === 'file');
    for (const file of files) {
      const pathParts = file.path.split('/').filter(Boolean);
      const name = pathParts.pop()!;
      const parentPath =
        pathParts.length > 0 ? '/' + pathParts.join('/') : null;

      // Find parent ID if needed
      let parentId: string | null = null;
      if (parentPath) {
        const allNodes = await getAllNodes();
        const parent = allNodes.find((n) => n.path === parentPath);
        if (parent) {
          parentId = parent.id;
        }
      }

      const language = detectLanguage(name);
      await createFile(name, parentId, file.content, language);
      console.log(`Created file: ${file.path}`);
    }

    console.log('✅ Sample files created successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize sample files:', error);
    throw error;
  }
}

/**
 * Get sample files count
 */
export function getSampleFilesCount(): number {
  return sampleFiles.filter((f) => f.type === 'file').length;
}

/**
 * Get sample folders count
 */
export function getSampleFoldersCount(): number {
  return sampleFiles.filter((f) => f.type === 'folder').length;
}
