/**
 * CodeForge IDE - Git Database
 * Agent 5: Phase 2 - Task 1
 * 
 * IndexedDB store for Git metadata (repositories, commits, branches, remotes, staging)
 */

/**
 * Git Repository metadata
 */
export interface GitRepository {
  id: string;
  name: string;
  fullName: string; // owner/repo
  owner: string;
  cloneUrl: string;
  defaultBranch: string;
  lastSynced: number; // timestamp
  description?: string;
  isPrivate?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Git Commit metadata
 */
export interface GitCommit {
  sha: string;
  repoId: string;
  message: string;
  author: string;
  authorEmail?: string;
  date: number; // timestamp
  parentShas: string[];
  treeSha?: string;
}

/**
 * Git Branch metadata
 */
export interface GitBranch {
  name: string;
  repoId: string;
  commitSha: string;
  isRemote: boolean;
  isActive: boolean;
  ahead?: number; // commits ahead of remote
  behind?: number; // commits behind remote
}

/**
 * Git Remote metadata
 */
export interface GitRemote {
  name: string;
  repoId: string;
  url: string;
  type: 'fetch' | 'push';
}

/**
 * Git Staging area entry
 */
export interface GitStagingEntry {
  id?: string; // Auto-generated
  repoId: string;
  filePath: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  originalContent?: string;
  modifiedContent?: string;
  originalPath?: string; // For renamed files
}

/**
 * Database name and version
 */
const DB_NAME = 'codeforge-git';
const DB_VERSION = 1;

/**
 * IndexedDB instance
 */
let db: IDBDatabase | null = null;

/**
 * Initialize Git database
 */
export async function initializeGitDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open Git database'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Repositories store
      if (!database.objectStoreNames.contains('repositories')) {
        const repoStore = database.createObjectStore('repositories', { keyPath: 'id' });
        repoStore.createIndex('fullName', 'fullName', { unique: true });
        repoStore.createIndex('owner', 'owner', { unique: false });
      }

      // Commits store
      if (!database.objectStoreNames.contains('commits')) {
        const commitStore = database.createObjectStore('commits', { keyPath: 'sha' });
        commitStore.createIndex('repoId', 'repoId', { unique: false });
        commitStore.createIndex('date', 'date', { unique: false });
      }

      // Branches store
      if (!database.objectStoreNames.contains('branches')) {
        const branchStore = database.createObjectStore('branches', { keyPath: ['repoId', 'name'] });
        branchStore.createIndex('repoId', 'repoId', { unique: false });
        branchStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // Remotes store
      if (!database.objectStoreNames.contains('remotes')) {
        const remoteStore = database.createObjectStore('remotes', { keyPath: ['repoId', 'name', 'type'] });
        remoteStore.createIndex('repoId', 'repoId', { unique: false });
      }

      // Staging store
      if (!database.objectStoreNames.contains('staging')) {
        const stagingStore = database.createObjectStore('staging', { keyPath: 'id', autoIncrement: true });
        stagingStore.createIndex('repoId', 'repoId', { unique: false });
        stagingStore.createIndex('filePath', 'filePath', { unique: false });
      }
    };
  });
}

/**
 * Get database instance
 */
function getDB(): IDBDatabase {
  if (!db) {
    throw new Error('Git database not initialized. Call initializeGitDB() first.');
  }
  return db;
}

// ============================================================================
// REPOSITORIES CRUD
// ============================================================================

/**
 * Create or update repository
 */
export async function saveRepository(repo: GitRepository): Promise<GitRepository> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['repositories'], 'readwrite');
    const store = transaction.objectStore('repositories');
    const request = store.put(repo);

    request.onsuccess = () => resolve(repo);
    request.onerror = () => reject(new Error('Failed to save repository'));
  });
}

/**
 * Get repository by ID
 */
export async function getRepository(id: string): Promise<GitRepository | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['repositories'], 'readonly');
    const store = transaction.objectStore('repositories');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get repository'));
  });
}

/**
 * Get repository by full name (owner/repo)
 */
export async function getRepositoryByFullName(fullName: string): Promise<GitRepository | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['repositories'], 'readonly');
    const store = transaction.objectStore('repositories');
    const index = store.index('fullName');
    const request = index.get(fullName);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get repository by full name'));
  });
}

/**
 * Get all repositories
 */
export async function getAllRepositories(): Promise<GitRepository[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['repositories'], 'readonly');
    const store = transaction.objectStore('repositories');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get all repositories'));
  });
}

/**
 * Delete repository and all related data
 */
export async function deleteRepository(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['repositories', 'commits', 'branches', 'remotes', 'staging'], 'readwrite');

    // Delete repository
    transaction.objectStore('repositories').delete(id);

    // Delete related commits
    const commitIndex = transaction.objectStore('commits').index('repoId');
    const commitRequest = commitIndex.openCursor(IDBKeyRange.only(id));
    commitRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete related branches
    const branchIndex = transaction.objectStore('branches').index('repoId');
    const branchRequest = branchIndex.openCursor(IDBKeyRange.only(id));
    branchRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete related remotes
    const remoteIndex = transaction.objectStore('remotes').index('repoId');
    const remoteRequest = remoteIndex.openCursor(IDBKeyRange.only(id));
    remoteRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete related staging entries
    const stagingIndex = transaction.objectStore('staging').index('repoId');
    const stagingRequest = stagingIndex.openCursor(IDBKeyRange.only(id));
    stagingRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to delete repository'));
  });
}

// ============================================================================
// COMMITS CRUD
// ============================================================================

/**
 * Save commit
 */
export async function saveCommit(commit: GitCommit): Promise<GitCommit> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readwrite');
    const store = transaction.objectStore('commits');
    const request = store.put(commit);

    request.onsuccess = () => resolve(commit);
    request.onerror = () => reject(new Error('Failed to save commit'));
  });
}

/**
 * Get commit by SHA
 */
export async function getCommit(sha: string): Promise<GitCommit | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readonly');
    const store = transaction.objectStore('commits');
    const request = store.get(sha);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get commit'));
  });
}

/**
 * Get commits by repository ID
 */
export async function getCommitsByRepo(repoId: string): Promise<GitCommit[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readonly');
    const store = transaction.objectStore('commits');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const commits = request.result;
      // Sort by date (newest first)
      commits.sort((a, b) => b.date - a.date);
      resolve(commits);
    };
    request.onerror = () => reject(new Error('Failed to get commits by repo'));
  });
}

/**
 * Delete commit
 */
export async function deleteCommit(sha: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readwrite');
    const store = transaction.objectStore('commits');
    const request = store.delete(sha);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete commit'));
  });
}

// ============================================================================
// BRANCHES CRUD
// ============================================================================

/**
 * Save branch
 */
export async function saveBranch(branch: GitBranch): Promise<GitBranch> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readwrite');
    const store = transaction.objectStore('branches');
    const request = store.put(branch);

    request.onsuccess = () => resolve(branch);
    request.onerror = () => reject(new Error('Failed to save branch'));
  });
}

/**
 * Get branch by repo ID and name
 */
export async function getBranch(repoId: string, name: string): Promise<GitBranch | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readonly');
    const store = transaction.objectStore('branches');
    const request = store.get([repoId, name]);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get branch'));
  });
}

/**
 * Get all branches for a repository
 */
export async function getBranchesByRepo(repoId: string): Promise<GitBranch[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readonly');
    const store = transaction.objectStore('branches');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get branches by repo'));
  });
}

/**
 * Get active branch for a repository
 */
export async function getActiveBranch(repoId: string): Promise<GitBranch | null> {
  const branches = await getBranchesByRepo(repoId);
  return branches.find(b => b.isActive) || null;
}

/**
 * Set active branch (deactivates all other branches)
 */
export async function setActiveBranch(repoId: string, branchName: string): Promise<void> {
  const branches = await getBranchesByRepo(repoId);
  
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readwrite');
    const store = transaction.objectStore('branches');

    // Update all branches
    branches.forEach(branch => {
      const updated = { ...branch, isActive: branch.name === branchName };
      store.put(updated);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to set active branch'));
  });
}

/**
 * Delete branch
 */
export async function deleteBranch(repoId: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readwrite');
    const store = transaction.objectStore('branches');
    const request = store.delete([repoId, name]);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete branch'));
  });
}

// ============================================================================
// REMOTES CRUD
// ============================================================================

/**
 * Save remote
 */
export async function saveRemote(remote: GitRemote): Promise<GitRemote> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['remotes'], 'readwrite');
    const store = transaction.objectStore('remotes');
    const request = store.put(remote);

    request.onsuccess = () => resolve(remote);
    request.onerror = () => reject(new Error('Failed to save remote'));
  });
}

/**
 * Get remote by repo ID, name, and type
 */
export async function getRemote(repoId: string, name: string, type: 'fetch' | 'push'): Promise<GitRemote | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['remotes'], 'readonly');
    const store = transaction.objectStore('remotes');
    const request = store.get([repoId, name, type]);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get remote'));
  });
}

/**
 * Get all remotes for a repository
 */
export async function getRemotesByRepo(repoId: string): Promise<GitRemote[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['remotes'], 'readonly');
    const store = transaction.objectStore('remotes');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get remotes by repo'));
  });
}

/**
 * Delete remote
 */
export async function deleteRemote(repoId: string, name: string, type: 'fetch' | 'push'): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['remotes'], 'readwrite');
    const store = transaction.objectStore('remotes');
    const request = store.delete([repoId, name, type]);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete remote'));
  });
}

// ============================================================================
// STAGING CRUD
// ============================================================================

/**
 * Add file to staging area
 */
export async function stageFile(entry: GitStagingEntry): Promise<GitStagingEntry> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readwrite');
    const store = transaction.objectStore('staging');
    const request = store.add(entry);

    request.onsuccess = () => {
      const created = { ...entry, id: request.result as string };
      resolve(created);
    };
    request.onerror = () => reject(new Error('Failed to stage file'));
  });
}

/**
 * Update staged file
 */
export async function updateStagedFile(entry: GitStagingEntry): Promise<GitStagingEntry> {
  if (!entry.id) {
    throw new Error('Staging entry must have an ID to update');
  }

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readwrite');
    const store = transaction.objectStore('staging');
    const request = store.put(entry);

    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(new Error('Failed to update staged file'));
  });
}

/**
 * Get staged file by path
 */
export async function getStagedFile(repoId: string, filePath: string): Promise<GitStagingEntry | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readonly');
    const store = transaction.objectStore('staging');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const entries = request.result as GitStagingEntry[];
      const entry = entries.find(e => e.filePath === filePath);
      resolve(entry || null);
    };
    request.onerror = () => reject(new Error('Failed to get staged file'));
  });
}

/**
 * Get all staged files for a repository
 */
export async function getStagedFiles(repoId: string): Promise<GitStagingEntry[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readonly');
    const store = transaction.objectStore('staging');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get staged files'));
  });
}

/**
 * Remove file from staging area
 */
export async function unstageFile(repoId: string, filePath: string): Promise<void> {
  const entry = await getStagedFile(repoId, filePath);
  if (!entry || !entry.id) return;

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readwrite');
    const store = transaction.objectStore('staging');
    const request = store.delete(entry.id!);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to unstage file'));
  });
}

/**
 * Clear all staged files for a repository
 */
export async function clearStagingArea(repoId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readwrite');
    const store = transaction.objectStore('staging');
    const index = store.index('repoId');
    const request = index.openCursor(IDBKeyRange.only(repoId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to clear staging area'));
  });
}
