/**
 * Git Database Layer - IndexedDB store for Git metadata
 * 
 * Manages local Git repository metadata including:
 * - Repositories: Cloned repo information
 * - Commits: Commit history and metadata
 * - Branches: Local and remote branch tracking
 * - Remotes: Remote repository connections
 * - Staging: File staging area before commit
 * 
 * @module lib/db/git-db
 */

import type {
  GitRepository,
  GitCommit,
  GitBranch,
  GitRemote,
  GitStagedFile
} from '../git/github-types';

const DB_NAME = 'codeforge-git';
const DB_VERSION = 1;

/**
 * Object Store names
 */
const STORES = {
  REPOSITORIES: 'repositories',
  COMMITS: 'commits',
  BRANCHES: 'branches',
  REMOTES: 'remotes',
  STAGING: 'staging'
} as const;

/**
 * Repository store schema
 */
export interface RepositoryRecord {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  cloneUrl: string;
  defaultBranch: string;
  lastSynced: number;
  description?: string;
  isPrivate?: boolean;
}

/**
 * Commit store schema
 */
export interface CommitRecord {
  sha: string;
  repoId: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  date: string;
  parentShas: string[];
  tree?: string;
}

/**
 * Branch store schema
 */
export interface BranchRecord {
  id: string; // repoId:branchName
  name: string;
  repoId: string;
  commitSha: string;
  isRemote: boolean;
  isActive: boolean;
  lastUpdated: number;
}

/**
 * Remote store schema
 */
export interface RemoteRecord {
  id: string; // repoId:remoteName
  name: string;
  repoId: string;
  url: string;
  type: 'fetch' | 'push' | 'both';
}

/**
 * Staging area schema
 */
export interface StagingRecord {
  id: string; // repoId:filePath
  repoId: string;
  filePath: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  originalContent?: string;
  modifiedContent?: string;
  stagedAt: number;
}

/**
 * Initialize or upgrade the Git database
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open Git database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Repositories store
      if (!db.objectStoreNames.contains(STORES.REPOSITORIES)) {
        const repoStore = db.createObjectStore(STORES.REPOSITORIES, { keyPath: 'id' });
        repoStore.createIndex('fullName', 'fullName', { unique: true });
        repoStore.createIndex('owner', 'owner', { unique: false });
        repoStore.createIndex('lastSynced', 'lastSynced', { unique: false });
      }

      // Commits store
      if (!db.objectStoreNames.contains(STORES.COMMITS)) {
        const commitStore = db.createObjectStore(STORES.COMMITS, { keyPath: 'sha' });
        commitStore.createIndex('repoId', 'repoId', { unique: false });
        commitStore.createIndex('date', 'date', { unique: false });
        commitStore.createIndex('author', 'author.email', { unique: false });
      }

      // Branches store
      if (!db.objectStoreNames.contains(STORES.BRANCHES)) {
        const branchStore = db.createObjectStore(STORES.BRANCHES, { keyPath: 'id' });
        branchStore.createIndex('repoId', 'repoId', { unique: false });
        branchStore.createIndex('isActive', 'isActive', { unique: false });
        branchStore.createIndex('name', 'name', { unique: false });
      }

      // Remotes store
      if (!db.objectStoreNames.contains(STORES.REMOTES)) {
        const remoteStore = db.createObjectStore(STORES.REMOTES, { keyPath: 'id' });
        remoteStore.createIndex('repoId', 'repoId', { unique: false });
      }

      // Staging store
      if (!db.objectStoreNames.contains(STORES.STAGING)) {
        const stagingStore = db.createObjectStore(STORES.STAGING, { keyPath: 'id' });
        stagingStore.createIndex('repoId', 'repoId', { unique: false });
        stagingStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

/**
 * Get database connection
 */
async function getDB(): Promise<IDBDatabase> {
  try {
    return await initDB();
  } catch (error) {
    throw new Error(`Git DB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// REPOSITORIES CRUD
// ============================================================================

/**
 * Add or update a repository
 */
export async function saveRepository(repo: RepositoryRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REPOSITORIES, 'readwrite');
    const store = tx.objectStore(STORES.REPOSITORIES);
    const request = store.put(repo);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save repository: ${request.error?.message}`));
  });
}

/**
 * Get repository by ID
 */
export async function getRepository(id: string): Promise<RepositoryRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REPOSITORIES, 'readonly');
    const store = tx.objectStore(STORES.REPOSITORIES);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get repository: ${request.error?.message}`));
  });
}

/**
 * Get all repositories
 */
export async function getAllRepositories(): Promise<RepositoryRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REPOSITORIES, 'readonly');
    const store = tx.objectStore(STORES.REPOSITORIES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error(`Failed to get repositories: ${request.error?.message}`));
  });
}

/**
 * Delete repository
 */
export async function deleteRepository(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REPOSITORIES, 'readwrite');
    const store = tx.objectStore(STORES.REPOSITORIES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete repository: ${request.error?.message}`));
  });
}

// ============================================================================
// COMMITS CRUD
// ============================================================================

/**
 * Save commit
 */
export async function saveCommit(commit: CommitRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COMMITS, 'readwrite');
    const store = tx.objectStore(STORES.COMMITS);
    const request = store.put(commit);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save commit: ${request.error?.message}`));
  });
}

/**
 * Get commit by SHA
 */
export async function getCommit(sha: string): Promise<CommitRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COMMITS, 'readonly');
    const store = tx.objectStore(STORES.COMMITS);
    const request = store.get(sha);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get commit: ${request.error?.message}`));
  });
}

/**
 * Get commits by repository
 */
export async function getCommitsByRepo(repoId: string): Promise<CommitRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COMMITS, 'readonly');
    const store = tx.objectStore(STORES.COMMITS);
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const commits = request.result || [];
      // Sort by date descending
      commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(commits);
    };
    request.onerror = () => reject(new Error(`Failed to get commits: ${request.error?.message}`));
  });
}

/**
 * Delete commit
 */
export async function deleteCommit(sha: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COMMITS, 'readwrite');
    const store = tx.objectStore(STORES.COMMITS);
    const request = store.delete(sha);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete commit: ${request.error?.message}`));
  });
}

// ============================================================================
// BRANCHES CRUD
// ============================================================================

/**
 * Save branch
 */
export async function saveBranch(branch: BranchRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readwrite');
    const store = tx.objectStore(STORES.BRANCHES);
    const request = store.put(branch);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save branch: ${request.error?.message}`));
  });
}

/**
 * Get branch by ID
 */
export async function getBranch(id: string): Promise<BranchRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readonly');
    const store = tx.objectStore(STORES.BRANCHES);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get branch: ${request.error?.message}`));
  });
}

/**
 * Get branches by repository
 */
export async function getBranchesByRepo(repoId: string): Promise<BranchRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readonly');
    const store = tx.objectStore(STORES.BRANCHES);
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error(`Failed to get branches: ${request.error?.message}`));
  });
}

/**
 * Get active branch for repository
 */
export async function getActiveBranch(repoId: string): Promise<BranchRecord | null> {
  const branches = await getBranchesByRepo(repoId);
  return branches.find(b => b.isActive) || null;
}

/**
 * Set active branch
 */
export async function setActiveBranch(repoId: string, branchName: string): Promise<void> {
  const db = await getDB();
  const branches = await getBranchesByRepo(repoId);

  const tx = db.transaction(STORES.BRANCHES, 'readwrite');
  const store = tx.objectStore(STORES.BRANCHES);

  return new Promise((resolve, reject) => {
    let pending = branches.length;
    let hasError = false;

    branches.forEach(branch => {
      const updated = { ...branch, isActive: branch.name === branchName };
      const request = store.put(updated);

      request.onsuccess = () => {
        pending--;
        if (pending === 0 && !hasError) resolve();
      };

      request.onerror = () => {
        hasError = true;
        reject(new Error(`Failed to update branch: ${request.error?.message}`));
      };
    });
  });
}

/**
 * Delete branch
 */
export async function deleteBranch(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readwrite');
    const store = tx.objectStore(STORES.BRANCHES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete branch: ${request.error?.message}`));
  });
}

// ============================================================================
// REMOTES CRUD
// ============================================================================

/**
 * Save remote
 */
export async function saveRemote(remote: RemoteRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REMOTES, 'readwrite');
    const store = tx.objectStore(STORES.REMOTES);
    const request = store.put(remote);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save remote: ${request.error?.message}`));
  });
}

/**
 * Get remotes by repository
 */
export async function getRemotesByRepo(repoId: string): Promise<RemoteRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REMOTES, 'readonly');
    const store = tx.objectStore(STORES.REMOTES);
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error(`Failed to get remotes: ${request.error?.message}`));
  });
}

/**
 * Delete remote
 */
export async function deleteRemote(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.REMOTES, 'readwrite');
    const store = tx.objectStore(STORES.REMOTES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete remote: ${request.error?.message}`));
  });
}

// ============================================================================
// STAGING CRUD
// ============================================================================

/**
 * Stage file
 */
export async function stageFile(file: StagingRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STAGING, 'readwrite');
    const store = tx.objectStore(STORES.STAGING);
    const request = store.put(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to stage file: ${request.error?.message}`));
  });
}

/**
 * Get staged files by repository
 */
export async function getStagedFiles(repoId: string): Promise<StagingRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STAGING, 'readonly');
    const store = tx.objectStore(STORES.STAGING);
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error(`Failed to get staged files: ${request.error?.message}`));
  });
}

/**
 * Unstage file
 */
export async function unstageFile(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.STAGING, 'readwrite');
    const store = tx.objectStore(STORES.STAGING);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to unstage file: ${request.error?.message}`));
  });
}

/**
 * Clear all staged files for repository
 */
export async function clearStaging(repoId: string): Promise<void> {
  const stagedFiles = await getStagedFiles(repoId);
  const db = await getDB();

  const tx = db.transaction(STORES.STAGING, 'readwrite');
  const store = tx.objectStore(STORES.STAGING);

  return new Promise((resolve, reject) => {
    let pending = stagedFiles.length;
    if (pending === 0) {
      resolve();
      return;
    }

    let hasError = false;

    stagedFiles.forEach(file => {
      const request = store.delete(file.id);

      request.onsuccess = () => {
        pending--;
        if (pending === 0 && !hasError) resolve();
      };

      request.onerror = () => {
        hasError = true;
        reject(new Error(`Failed to clear staging: ${request.error?.message}`));
      };
    });
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all data for a repository
 */
export async function clearRepositoryData(repoId: string): Promise<void> {
  try {
    // Delete repository
    await deleteRepository(repoId);

    // Delete all commits
    const commits = await getCommitsByRepo(repoId);
    await Promise.all(commits.map(c => deleteCommit(c.sha)));

    // Delete all branches
    const branches = await getBranchesByRepo(repoId);
    await Promise.all(branches.map(b => deleteBranch(b.id)));

    // Delete all remotes
    const remotes = await getRemotesByRepo(repoId);
    await Promise.all(remotes.map(r => deleteRemote(r.id)));

    // Clear staging
    await clearStaging(repoId);
  } catch (error) {
    throw new Error(`Failed to clear repository data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<{
  repositories: number;
  commits: number;
  branches: number;
  remotes: number;
  staged: number;
}> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORES.REPOSITORIES, STORES.COMMITS, STORES.BRANCHES, STORES.REMOTES, STORES.STAGING],
      'readonly'
    );

    const stats = {
      repositories: 0,
      commits: 0,
      branches: 0,
      remotes: 0,
      staged: 0
    };

    let pending = 5;

    const onComplete = () => {
      pending--;
      if (pending === 0) resolve(stats);
    };

    tx.objectStore(STORES.REPOSITORIES).count().onsuccess = (e) => {
      stats.repositories = (e.target as IDBRequest).result;
      onComplete();
    };

    tx.objectStore(STORES.COMMITS).count().onsuccess = (e) => {
      stats.commits = (e.target as IDBRequest).result;
      onComplete();
    };

    tx.objectStore(STORES.BRANCHES).count().onsuccess = (e) => {
      stats.branches = (e.target as IDBRequest).result;
      onComplete();
    };

    tx.objectStore(STORES.REMOTES).count().onsuccess = (e) => {
      stats.remotes = (e.target as IDBRequest).result;
      onComplete();
    };

    tx.objectStore(STORES.STAGING).count().onsuccess = (e) => {
      stats.staged = (e.target as IDBRequest).result;
      onComplete();
    };

    tx.onerror = () => reject(new Error(`Failed to get stats: ${tx.error?.message}`));
  });
}
