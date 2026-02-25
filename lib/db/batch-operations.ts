/**
 * CodeForge IDE - Batch Operations for IndexedDB
 * Performance optimization through batch writes and caching
 */

import type { GitCommit, GitBranch, GitStagingEntry } from './git-db';
import { initializeGitDB } from './git-db';

/**
 * Get database instance
 */
function getDB(): IDBDatabase {
  const openRequest = indexedDB.open('codeforge-git', 1);
  return openRequest.result;
}

/**
 * Batch save commits in a single transaction
 * Performance: N operations → 1 transaction
 */
export async function batchSaveCommits(commits: GitCommit[]): Promise<void> {
  if (commits.length === 0) return;

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readwrite');
    const store = transaction.objectStore('commits');

    // Add all commits in one transaction
    for (const commit of commits) {
      store.put(commit);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to batch save commits'));
  });
}

/**
 * Batch save branches in a single transaction
 */
export async function batchSaveBranches(branches: GitBranch[]): Promise<void> {
  if (branches.length === 0) return;

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readwrite');
    const store = transaction.objectStore('branches');

    for (const branch of branches) {
      store.put(branch);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to batch save branches'));
  });
}

/**
 * Batch stage files in a single transaction
 */
export async function batchStageFiles(entries: GitStagingEntry[]): Promise<void> {
  if (entries.length === 0) return;

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readwrite');
    const store = transaction.objectStore('staging');

    for (const entry of entries) {
      if (entry.id) {
        store.put(entry);
      } else {
        store.add(entry);
      }
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to batch stage files'));
  });
}

/**
 * Batch delete items from a store
 */
export async function batchDelete(
  storeName: 'commits' | 'branches' | 'staging',
  keys: any[]
): Promise<void> {
  if (keys.length === 0) return;

  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    for (const key of keys) {
      store.delete(key);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error(`Failed to batch delete from ${storeName}`));
  });
}

// ============================================================================
// CACHING LAYER
// ============================================================================

/**
 * In-memory cache for frequently accessed data
 */
class DBCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge: number = 5 * 60 * 1000, maxSize: number = 100) {
    this.maxAge = maxAge; // 5 minutes default
    this.maxSize = maxSize;
  }

  /**
   * Get from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T): void {
    // Enforce max size with LRU (delete oldest)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Export cache instances
 */
export const commitsCache = new DBCache<GitCommit[]>(5 * 60 * 1000, 50);
export const branchesCache = new DBCache<GitBranch[]>(3 * 60 * 1000, 30);
export const stagingCache = new DBCache<GitStagingEntry[]>(1 * 60 * 1000, 20);

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  commitsCache.clear();
  branchesCache.clear();
  stagingCache.clear();
}

// ============================================================================
// CACHED OPERATIONS
// ============================================================================

/**
 * Get commits with caching
 */
export async function getCachedCommitsByRepo(repoId: string): Promise<GitCommit[]> {
  // Check cache first
  const cached = commitsCache.get(repoId);
  if (cached) {
    return cached;
  }

  // Fetch from DB
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['commits'], 'readonly');
    const store = transaction.objectStore('commits');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const commits = request.result as GitCommit[];
      commits.sort((a, b) => b.date - a.date);
      
      // Cache result
      commitsCache.set(repoId, commits);
      resolve(commits);
    };
    request.onerror = () => reject(new Error('Failed to get commits'));
  });
}

/**
 * Get branches with caching
 */
export async function getCachedBranchesByRepo(repoId: string): Promise<GitBranch[]> {
  // Check cache first
  const cached = branchesCache.get(repoId);
  if (cached) {
    return cached;
  }

  // Fetch from DB
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['branches'], 'readonly');
    const store = transaction.objectStore('branches');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const branches = request.result as GitBranch[];
      
      // Cache result
      branchesCache.set(repoId, branches);
      resolve(branches);
    };
    request.onerror = () => reject(new Error('Failed to get branches'));
  });
}

/**
 * Get staged files with caching
 */
export async function getCachedStagedFiles(repoId: string): Promise<GitStagingEntry[]> {
  // Check cache first
  const cached = stagingCache.get(repoId);
  if (cached) {
    return cached;
  }

  // Fetch from DB
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['staging'], 'readonly');
    const store = transaction.objectStore('staging');
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => {
      const entries = request.result as GitStagingEntry[];
      
      // Cache result
      stagingCache.set(repoId, entries);
      resolve(entries);
    };
    request.onerror = () => reject(new Error('Failed to get staged files'));
  });
}

/**
 * Invalidate caches for a repository
 */
export function invalidateRepoCache(repoId: string): void {
  commitsCache.invalidate(repoId);
  branchesCache.invalidate(repoId);
  stagingCache.invalidate(repoId);
}
