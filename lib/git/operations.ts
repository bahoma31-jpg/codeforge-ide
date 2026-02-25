/**
 * Git Core Operations
 * 
 * Pure functions for Git operations without UI or state management.
 * 
 * @module lib/git/operations
 */

import { GitHubAPI } from './github';
import { calculateDiff } from './diff';
import { getFileStatus, type FileStatus } from './status';
import type { FileNode } from '../stores/files-store';
import type {
  GitHubUser,
  GitHubRepository,
  GitTreeItem,
  GitCommit,
  GitBlob
} from './github-types';

/**
 * Progress callback for clone operations
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Status of changed files
 */
export interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  unchanged: string[];
}

/**
 * Clone repository and return file tree
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param token - GitHub token
 * @param branch - Branch to clone (default: main)
 * @param onProgress - Progress callback
 * @returns Array of FileNode ready for files-store
 * 
 * @example
 * ```ts
 * const files = await cloneRepository(
 *   'facebook',
 *   'react',
 *   token,
 *   'main',
 *   (progress, msg) => console.log(`${progress}%: ${msg}`)
 * );
 * ```
 */
export async function cloneRepository(
  owner: string,
  repo: string,
  token: string,
  branch: string = 'main',
  onProgress?: ProgressCallback
): Promise<FileNode[]> {
  try {
    const api = new GitHubAPI(token);

    onProgress?.(10, 'Fetching repository tree...');

    // Get repository tree (recursive)
    const tree = await api.getTree(owner, repo, branch, true);

    onProgress?.(30, `Found ${tree.tree.length} items`);

    // Filter out directories, get only files
    const files = tree.tree.filter(item => item.type === 'blob');

    onProgress?.(40, `Downloading ${files.length} files...`);

    // Download file contents
    const fileNodes: FileNode[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      try {
        // Get file content
        const content = await api.getFileContent(owner, repo, item.path!, branch);

        // Create FileNode
        const pathParts = item.path!.split('/');
        const name = pathParts[pathParts.length - 1];

        fileNodes.push({
          id: item.path!,
          name,
          type: 'file',
          path: item.path!,
          content,
          language: detectLanguage(name),
          size: item.size
        });

        // Update progress
        const progress = 40 + Math.floor((i / totalFiles) * 50);
        onProgress?.(progress, `Downloaded ${i + 1}/${totalFiles} files`);
      } catch (error) {
        console.warn(`Failed to download ${item.path}:`, error);
      }
    }

    onProgress?.(100, 'Clone complete!');

    return fileNodes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to clone repository: ${message}`);
  }
}

/**
 * Calculate status by comparing local files with last commit
 * 
 * @param localFiles - Current local files
 * @param lastCommitFiles - Files from last commit
 * @returns GitStatus
 * 
 * @example
 * ```ts
 * const status = calculateStatus(localFiles, commitFiles);
 * console.log(`Modified: ${status.modified.length}`);
 * ```
 */
export function calculateStatus(
  localFiles: FileNode[],
  lastCommitFiles: FileNode[]
): GitStatus {
  try {
    const status: GitStatus = {
      modified: [],
      added: [],
      deleted: [],
      unchanged: []
    };

    // Create maps for quick lookup
    const localMap = new Map(localFiles.map(f => [f.path, f]));
    const commitMap = new Map(lastCommitFiles.map(f => [f.path, f]));

    // Check each local file
    for (const localFile of localFiles) {
      const commitFile = commitMap.get(localFile.path);

      if (!commitFile) {
        // File doesn't exist in commit = added
        status.added.push(localFile.path);
      } else if (localFile.content !== commitFile.content) {
        // Content differs = modified
        status.modified.push(localFile.path);
      } else {
        // Content same = unchanged
        status.unchanged.push(localFile.path);
      }
    }

    // Check for deleted files
    for (const commitFile of lastCommitFiles) {
      if (!localMap.has(commitFile.path)) {
        status.deleted.push(commitFile.path);
      }
    }

    return status;
  } catch (error) {
    console.error('Error calculating status:', error);
    return {
      modified: [],
      added: [],
      deleted: [],
      unchanged: []
    };
  }
}

/**
 * Create Git tree from changed files
 * 
 * @param changedFiles - Files that changed
 * @param baseTree - Base tree SHA to build upon
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param token - GitHub token
 * @returns Tree SHA
 * 
 * @example
 * ```ts
 * const treeSha = await createCommitTree(
 *   changedFiles,
 *   baseTreeSha,
 *   'facebook',
 *   'react',
 *   token
 * );
 * ```
 */
export async function createCommitTree(
  changedFiles: FileNode[],
  baseTree: string,
  owner: string,
  repo: string,
  token: string
): Promise<string> {
  try {
    const api = new GitHubAPI(token);

    // Create blobs for changed files
    const treeItems: GitTreeItem[] = [];

    for (const file of changedFiles) {
      // Create blob
      const blob = await api.createBlob(owner, repo, file.content, 'utf-8');

      treeItems.push({
        path: file.path,
        mode: '100644', // Regular file
        type: 'blob',
        sha: blob.sha
      });
    }

    // Create tree
    const tree = await api.createTree(owner, repo, treeItems, baseTree);

    return tree.sha;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create commit tree: ${message}`);
  }
}

/**
 * Create a commit
 * 
 * @param message - Commit message
 * @param treeSha - Tree SHA
 * @param parentSha - Parent commit SHA
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param token - GitHub token
 * @returns Commit SHA
 * 
 * @example
 * ```ts
 * const commitSha = await createCommit(
 *   'Fix bug',
 *   treeSha,
 *   parentSha,
 *   'facebook',
 *   'react',
 *   token
 * );
 * ```
 */
export async function createCommit(
  message: string,
  treeSha: string,
  parentSha: string,
  owner: string,
  repo: string,
  token: string
): Promise<string> {
  try {
    const api = new GitHubAPI(token);

    const commit = await api.createCommit(
      owner,
      repo,
      message,
      treeSha,
      [parentSha]
    );

    return commit.sha;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create commit: ${message}`);
  }
}

/**
 * Push commit to remote branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param commitSha - Commit SHA to push
 * @param token - GitHub token
 * @param force - Force push (default: false)
 * @returns Updated reference
 * 
 * @example
 * ```ts
 * await pushToRemote(
 *   'facebook',
 *   'react',
 *   'main',
 *   commitSha,
 *   token,
 *   false
 * );
 * ```
 */
export async function pushToRemote(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  token: string,
  force: boolean = false
): Promise<void> {
  try {
    const api = new GitHubAPI(token);

    // Update branch reference
    await api.updateRef(
      owner,
      repo,
      `heads/${branch}`,
      commitSha,
      force
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to push to remote: ${message}`);
  }
}

/**
 * Pull changes from remote branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param token - GitHub token
 * @returns Updated files
 * 
 * @example
 * ```ts
 * const updatedFiles = await pullFromRemote(
 *   'facebook',
 *   'react',
 *   'main',
 *   token
 * );
 * ```
 */
export async function pullFromRemote(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<FileNode[]> {
  try {
    const api = new GitHubAPI(token);

    // Get latest commit
    const ref = await api.getRef(owner, repo, `heads/${branch}`);
    const commitSha = ref.object.sha;

    // Get commit details
    const commit = await api.getCommit(owner, repo, commitSha);

    // Get tree
    const tree = await api.getTree(owner, repo, commit.tree.sha, true);

    // Download files
    const files = tree.tree.filter(item => item.type === 'blob');
    const fileNodes: FileNode[] = [];

    for (const item of files) {
      try {
        const content = await api.getFileContent(owner, repo, item.path!, branch);

        const pathParts = item.path!.split('/');
        const name = pathParts[pathParts.length - 1];

        fileNodes.push({
          id: item.path!,
          name,
          type: 'file',
          path: item.path!,
          content,
          language: detectLanguage(name),
          size: item.size
        });
      } catch (error) {
        console.warn(`Failed to download ${item.path}:`, error);
      }
    }

    return fileNodes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to pull from remote: ${message}`);
  }
}

/**
 * Merge branches using GitHub API
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param base - Base branch
 * @param head - Head branch to merge
 * @param token - GitHub token
 * @param commitMessage - Optional merge commit message
 * @returns Merge result with conflicts if any
 * 
 * @example
 * ```ts
 * const result = await mergeBranches(
 *   'facebook',
 *   'react',
 *   'main',
 *   'feature-branch',
 *   token,
 *   'Merge feature'
 * );
 * ```
 */
export async function mergeBranches(
  owner: string,
  repo: string,
  base: string,
  head: string,
  token: string,
  commitMessage?: string
): Promise<{
  success: boolean;
  sha?: string;
  conflicts?: string[];
  message: string;
}> {
  try {
    const api = new GitHubAPI(token);

    // Attempt merge
    const result = await api.mergeBranches(
      owner,
      repo,
      base,
      head,
      commitMessage
    );

    return {
      success: true,
      sha: result.sha,
      message: 'Merge successful'
    };
  } catch (error: any) {
    // Check if it's a merge conflict
    if (error?.response?.status === 409) {
      return {
        success: false,
        conflicts: ['Merge conflicts detected'],
        message: 'Merge conflicts must be resolved manually'
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to merge branches: ${message}`);
  }
}

/**
 * Get file diff between two versions
 * 
 * @param oldContent - Old file content
 * @param newContent - New file content
 * @returns Diff result
 * 
 * @example
 * ```ts
 * const diff = getFileDiff(oldContent, newContent);
 * console.log(`+${diff.additions} -${diff.deletions}`);
 * ```
 */
export function getFileDiff(oldContent: string, newContent: string) {
  return calculateDiff(oldContent, newContent);
}

/**
 * Compare two file trees and get changes
 * 
 * @param oldFiles - Old file tree
 * @param newFiles - New file tree
 * @returns Object with changed, added, deleted files
 * 
 * @example
 * ```ts
 * const changes = compareFileTrees(oldFiles, newFiles);
 * console.log(`${changes.changed.length} files changed`);
 * ```
 */
export function compareFileTrees(
  oldFiles: FileNode[],
  newFiles: FileNode[]
): {
  changed: FileNode[];
  added: FileNode[];
  deleted: FileNode[];
} {
  try {
    const oldMap = new Map(oldFiles.map(f => [f.path, f]));
    const newMap = new Map(newFiles.map(f => [f.path, f]));

    const changed: FileNode[] = [];
    const added: FileNode[] = [];
    const deleted: FileNode[] = [];

    // Check new files
    for (const newFile of newFiles) {
      const oldFile = oldMap.get(newFile.path);

      if (!oldFile) {
        added.push(newFile);
      } else if (oldFile.content !== newFile.content) {
        changed.push(newFile);
      }
    }

    // Check for deleted files
    for (const oldFile of oldFiles) {
      if (!newMap.has(oldFile.path)) {
        deleted.push(oldFile);
      }
    }

    return { changed, added, deleted };
  } catch (error) {
    console.error('Error comparing file trees:', error);
    return { changed: [], added: [], deleted: [] };
  }
}

/**
 * Create a new branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branchName - New branch name
 * @param fromSha - SHA to create branch from
 * @param token - GitHub token
 * @returns Reference to new branch
 * 
 * @example
 * ```ts
 * await createBranch(
 *   'facebook',
 *   'react',
 *   'feature-branch',
 *   commitSha,
 *   token
 * );
 * ```
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromSha: string,
  token: string
): Promise<void> {
  try {
    const api = new GitHubAPI(token);

    await api.createRef(
      owner,
      repo,
      `heads/${branchName}`,
      fromSha
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create branch: ${message}`);
  }
}

/**
 * Delete a branch
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branchName - Branch name to delete
 * @param token - GitHub token
 * 
 * @example
 * ```ts
 * await deleteBranch('facebook', 'react', 'old-feature', token);
 * ```
 */
export async function deleteBranch(
  owner: string,
  repo: string,
  branchName: string,
  token: string
): Promise<void> {
  try {
    const api = new GitHubAPI(token);

    await api.deleteRef(owner, repo, `heads/${branchName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete branch: ${message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detect programming language from file name
 * 
 * @param fileName - File name with extension
 * @returns Language identifier
 */
function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell'
  };

  return languageMap[ext || ''] || 'plaintext';
}

/**
 * Validate commit message
 * 
 * @param message - Commit message
 * @returns Validation result
 */
export function validateCommitMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || message.trim().length === 0) {
    return {
      valid: false,
      error: 'Commit message cannot be empty'
    };
  }

  if (message.length > 500) {
    return {
      valid: false,
      error: 'Commit message too long (max 500 characters)'
    };
  }

  return { valid: true };
}

/**
 * Validate branch name
 * 
 * @param branchName - Branch name
 * @returns Validation result
 */
export function validateBranchName(branchName: string): {
  valid: boolean;
  error?: string;
} {
  if (!branchName || branchName.trim().length === 0) {
    return {
      valid: false,
      error: 'Branch name cannot be empty'
    };
  }

  // Check for invalid characters
  if (!/^[a-zA-Z0-9_\-\/\.]+$/.test(branchName)) {
    return {
      valid: false,
      error: 'Branch name contains invalid characters'
    };
  }

  // Check for reserved names
  const reserved = ['HEAD', 'master', 'main'];
  if (reserved.includes(branchName)) {
    return {
      valid: false,
      error: `Cannot use reserved name: ${branchName}`
    };
  }

  return { valid: true };
}
