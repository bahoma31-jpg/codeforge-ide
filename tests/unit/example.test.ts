import { describe, it, expect } from 'vitest';

describe('CodeForge IDE - Infrastructure Tests', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct app constants', () => {
    const APP_NAME = 'CodeForge IDE';
    const APP_VERSION = '0.1.0';
    expect(APP_NAME).toBe('CodeForge IDE');
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should validate file node structure', () => {
    const fileNode = {
      id: 'test-1',
      name: 'index.ts',
      type: 'file' as const,
      path: '/src/index.ts',
      content: 'console.log("hello");',
      updatedAt: Date.now(),
    };

    expect(fileNode).toHaveProperty('id');
    expect(fileNode).toHaveProperty('name');
    expect(fileNode).toHaveProperty('type');
    expect(fileNode).toHaveProperty('path');
    expect(fileNode.type).toBe('file');
  });

  it('should validate folder node structure', () => {
    const folderNode = {
      id: 'folder-1',
      name: 'src',
      type: 'folder' as const,
      path: '/src',
      children: [],
      updatedAt: Date.now(),
    };

    expect(folderNode.type).toBe('folder');
    expect(folderNode.children).toEqual([]);
  });
});
