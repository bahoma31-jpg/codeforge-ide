/**
 * CodeForge IDE - Git Operations
 * Agent 5: Phase 2 - Task 3
 * 
 * Core Git logic (pure functions)
 */

import { GitHubAPI } from '../api/github';
import type { FileNode } from '../db/schema';

/**
 * File change for commit
 */
export interface FileChange {
  path: string;
  content: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  previousPath?: string; // For renamed files
}

/**
 * Git status result
 */
export interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  staged: string[];
}

/**
 * File comparison result
 */
interface FileComparison {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'unchanged';
}

/**
 * Clone repository and return file tree
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param token - GitHub authentication token
 * @param onProgress - Progress callback (0-1)
 * @returns Array of FileNode objects ready for files-store
 */
export async function cloneRepository(
  owner: string,
  repo: string,
  token: string,
  onProgress?: (progress: number) => void
): Promise<FileNode[]> {
  const api = new GitHubAPI(token);
  const files: FileNode[] = [];

  try {
    // Get repository info
    onProgress?.(0.1);
    const repoInfo = await api.getRepository(owner, repo);
    const defaultBranch = repoInfo.default_branch;

    // Get file tree (recursive)
    onProgress?.(0.2);
    const tree = await api.getTree(owner, repo, defaultBranch, true);

    // Filter files and directories
    const items = tree.tree.filter(item => 
      item.type === 'blob' || item.type === 'tree'
    );

    // Process each item
    const totalItems = items.length;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const progress = 0.2 + (i / totalItems) * 0.7;
      onProgress?.(progress);

      // Parse path to get name and parent
      const pathParts = item.path!.split('/');
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');

      if (item.type === 'tree') {
        // Directory
        files.push({
          id: `dir-${item.path}`,
          name,
          path: item.path!,
          type: 'folder',
          parentId: parentPath ? `dir-${parentPath}` : null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (item.type === 'blob') {
        // File - fetch content
        try {
          const content = await api.getFileContent(owner, repo, item.path!);
          
          // Determine language from extension
          const ext = name.split('.').pop()?.toLowerCase();
          const language = getLanguageFromExtension(ext || '');

          files.push({
            id: `file-${item.path}`,
            name,
            path: item.path!,
            type: 'file',
            content: content.content,
            language,
            size: item.size,
            parentId: parentPath ? `dir-${parentPath}` : null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (error) {
          console.warn(`Failed to fetch content for ${item.path}:`, error);
          // Create file node without content
          files.push({
            id: `file-${item.path}`,
            name,
            path: item.path!,
            type: 'file',
            content: '',
            size: item.size,
            parentId: parentPath ? `dir-${parentPath}` : null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
    }

    onProgress?.(1);
    return files;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate repository status by comparing local files with last commit
 * 
 * @param localFiles - Current local files
 * @param lastCommitFiles - Files from last commit
 * @returns Git status object
 */
export function calculateStatus(
  localFiles: Array<{ path: string; content: string }>,
  lastCommitFiles: Array<{ path: string; content: string }>
): GitStatus {
  const modified: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];

  // Create maps for quick lookup
  const localMap = new Map(localFiles.map(f => [f.path, f.content]));
  const commitMap = new Map(lastCommitFiles.map(f => [f.path, f.content]));

  // Check local files
  for (const file of localFiles) {
    const commitContent = commitMap.get(file.path);
    if (commitContent === undefined) {
      // File doesn't exist in commit - added
      added.push(file.path);
    } else if (commitContent !== file.content) {
      // File exists but content differs - modified
      modified.push(file.path);
    }
  }

  // Check for deleted files
  for (const file of lastCommitFiles) {
    if (!localMap.has(file.path)) {
      deleted.push(file.path);
    }
  }

  return {
    modified,
    added,
    deleted,
    staged: [] // Staged files handled separately
  };
}

/**
 * Create Git tree from file changes
 * 
 * @param changes - Array of file changes
 * @param baseTreeSha - Base tree SHA (from parent commit)
 * @param token - GitHub authentication token
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Tree SHA
 */
export async function createCommitTree(
  changes: FileChange[],
  baseTreeSha: string | null,
  token: string,
  owner: string,
  repo: string
): Promise<string> {
  const api = new GitHubAPI(token);

  try {
    // Prepare tree items
    const tree: Array<{
      path: string;
      mode: '100644' | '100755' | '040000' | '160000' | '120000';
      type: 'blob' | 'tree' | 'commit';
      sha?: string;
      content?: string;
    }> = [];

    for (const change of changes) {
      if (change.status === 'deleted') {
        // Deleted files handled by not including them in new tree
        continue;
      }

      if (change.status === 'renamed' && change.previousPath) {
        // Renamed: remove old, add new
        tree.push({
          path: change.path,
          mode: '100644',
          type: 'blob',
          content: change.content
        });
      } else {
        // Added or modified
        tree.push({
          path: change.path,
          mode: '100644',
          type: 'blob',
          content: change.content
        });
      }
    }

    // Create tree via API
    const response = await api.createTree(owner, repo, tree, baseTreeSha || undefined);
    return response.sha;
  } catch (error) {
    throw new Error(`Failed to create commit tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create Git commit
 * 
 * @param message - Commit message
 * @param treeSha - Tree SHA
 * @param parentSha - Parent commit SHA (null for initial commit)
 * @param token - GitHub authentication token
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Commit SHA
 */
export async function createCommit(
  message: string,
  treeSha: string,
  parentSha: string | null,
  token: string,
  owner: string,
  repo: string
): Promise<string> {
  const api = new GitHubAPI(token);

  try {
    const parents = parentSha ? [parentSha] : [];
    const response = await api.createCommit(owner, repo, message, treeSha, parents);
    return response.sha;
  } catch (error) {
    throw new Error(`Failed to create commit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Push commit to remote branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param commitSha - Commit SHA to push
 * @param token - GitHub authentication token
 */
export async function pushToRemote(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  token: string
): Promise<void> {
  const api = new GitHubAPI(token);

  try {
    await api.updateReference(owner, repo, `heads/${branch}`, commitSha, false);
  } catch (error) {
    throw new Error(`Failed to push to remote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pull changes from remote branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param token - GitHub authentication token
 * @returns Array of updated files
 */
export async function pullFromRemote(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<FileNode[]> {
  const api = new GitHubAPI(token);
  const files: FileNode[] = [];

  try {
    // Get latest commit
    const commits = await api.getCommits(owner, repo, branch, 1);
    if (commits.length === 0) {
      throw new Error('No commits found on remote branch');
    }

    const latestCommit = commits[0];

    // Get tree from commit
    const tree = await api.getTree(owner, repo, latestCommit.sha, true);

    // Process files
    for (const item of tree.tree) {
      if (item.type === 'blob' && item.path) {
        try {
          const content = await api.getFileContent(owner, repo, item.path, branch);
          
          const pathParts = item.path.split('/');
          const name = pathParts[pathParts.length - 1];
          const parentPath = pathParts.slice(0, -1).join('/');
          const ext = name.split('.').pop()?.toLowerCase();
          const language = getLanguageFromExtension(ext || '');

          files.push({
            id: `file-${item.path}`,
            name,
            path: item.path,
            type: 'file',
            content: content.content,
            language,
            size: item.size,
            parentId: parentPath ? `dir-${parentPath}` : null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (error) {
          console.warn(`Failed to fetch content for ${item.path}:`, error);
        }
      }
    }

    return files;
  } catch (error) {
    throw new Error(`Failed to pull from remote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Merge branches using GitHub API
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param base - Base branch name
 * @param head - Head branch name (branch to merge)
 * @param token - GitHub authentication token
 * @returns Merge result with conflict detection
 */
export async function mergeBranches(
  owner: string,
  repo: string,
  base: string,
  head: string,
  token: string
): Promise<{
  success: boolean;
  sha?: string;
  conflicts?: string[];
  message?: string;
}> {
  const api = new GitHubAPI(token);

  try {
    const result = await api.mergeBranches(owner, repo, base, head);
    
    if (result.sha) {
      return {
        success: true,
        sha: result.sha,
        message: result.message
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error) {
    // Check if it's a merge conflict
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.toLowerCase().includes('conflict')) {
      return {
        success: false,
        conflicts: [], // GitHub API doesn't provide detailed conflict info
        message: 'Merge conflict detected'
      };
    }
    throw new Error(`Failed to merge branches: ${errorMessage}`);
  }
}

/**
 * Get language from file extension
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    md: 'markdown',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    txt: 'plaintext'
  };

  return languageMap[ext] || 'plaintext';
}
