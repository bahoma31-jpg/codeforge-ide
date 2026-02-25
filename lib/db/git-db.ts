/**
 * CodeForge IDE - Git Metadata Database
 * Agent 5: GitHub Integration
 * 
 * IndexedDB storage for Git metadata (repositories, commits, branches, remotes)
 * Separate from file system database to maintain clean separation of concerns
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';

export const GIT_DB_NAME = 'codeforge-git';
export const GIT_DB_VERSION = 1;

/**
 * Git Repository metadata
 */
export interface GitRepository {
  id: string;              // UUID
  name: string;            // "codeforge-ide"
  fullName: string;        // "bahoma31-jpg/codeforge-ide"
  owner: string;           // "bahoma31-jpg"
  cloneUrl: string;        // "https://github.com/..."
  sshUrl?: string;         // "git@github.com:..."
  defaultBranch: string;   // "main"
  description?: string;
  isPrivate: boolean;
  stars: number;
  forks: number;
  language?: string;
  lastSynced: number;      // Timestamp
  createdAt: number;
  updatedAt: number;
}

/**
 * Git Commit metadata
 */
export interface GitCommit {
  sha: string;                    // Commit SHA (primary key)
  repoId: string;                 // Repository ID
  message: string;                // Commit message
  author: {
    name: string;
    email: string;
    date: string;                 // ISO timestamp
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  parentShas: string[];           // Parent commit SHAs
  treeSha: string;                // Tree SHA
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: string[];               // Changed file paths
  createdAt: number;              // Local timestamp
}

/**
 * Git Branch metadata
 */
export interface GitBranch {
  id: string;                     // UUID
  name: string;                   // "main", "feature/xyz"
  repoId: string;                 // Repository ID
  commitSha: string;              // Current commit SHA
  isRemote: boolean;              // Local or remote branch
  isActive: boolean;              // Currently checked out
  protected: boolean;
  ahead: number;                  // Commits ahead of remote
  behind: number;                 // Commits behind remote
  createdAt: number;
  updatedAt: number;
}

/**
 * Git Remote metadata
 */
export interface GitRemote {
  id: string;                     // UUID
  name: string;                   // "origin", "upstream"
  repoId: string;                 // Repository ID
  url: string;                    // Remote URL
  type: 'https' | 'ssh';
  createdAt: number;
}

/**
 * Git Staging area
 */
export interface GitStaging {
  id: string;                     // UUID
  repoId: string;                 // Repository ID
  filePath: string;               // "/src/index.ts"
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  originalContent?: string;       // Original file content
  modifiedContent?: string;       // Modified file content
  originalPath?: string;          // For renamed files
  staged: boolean;                // Staged for commit
  createdAt: number;
  updatedAt: number;
}

/**
 * IndexedDB Schema
 */
interface GitDBSchema extends DBSchema {
  repositories: {
    key: string;
    value: GitRepository;
    indexes: {
      'fullName': string;
      'owner': string;
      'updatedAt': number;
    };
  };
  commits: {
    key: string;
    value: GitCommit;
    indexes: {
      'repoId': string;
      'createdAt': number;
      'author.name': string;
    };
  };
  branches: {
    key: string;
    value: GitBranch;
    indexes: {
      'repoId': string;
      'name': string;
      'isActive': boolean;
    };
  };
  remotes: {
    key: string;
    value: GitRemote;
    indexes: {
      'repoId': string;
      'name': string;
    };
  };
  staging: {
    key: string;
    value: GitStaging;
    indexes: {
      'repoId': string;
      'filePath': string;
      'staged': boolean;
    };
  };
}

/**
 * Open Git database
 */
export async function openGitDB(): Promise<IDBPDatabase<GitDBSchema>> {
  return openDB<GitDBSchema>(GIT_DB_NAME, GIT_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create repositories store
      if (!db.objectStoreNames.contains('repositories')) {
        const repoStore = db.createObjectStore('repositories', { keyPath: 'id' });
        repoStore.createIndex('fullName', 'fullName', { unique: true });
        repoStore.createIndex('owner', 'owner', { unique: false });
        repoStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Create commits store
      if (!db.objectStoreNames.contains('commits')) {
        const commitStore = db.createObjectStore('commits', { keyPath: 'sha' });
        commitStore.createIndex('repoId', 'repoId', { unique: false });
        commitStore.createIndex('createdAt', 'createdAt', { unique: false });
        commitStore.createIndex('author.name', 'author.name', { unique: false });
      }

      // Create branches store
      if (!db.objectStoreNames.contains('branches')) {
        const branchStore = db.createObjectStore('branches', { keyPath: 'id' });
        branchStore.createIndex('repoId', 'repoId', { unique: false });
        branchStore.createIndex('name', 'name', { unique: false });
        branchStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // Create remotes store
      if (!db.objectStoreNames.contains('remotes')) {
        const remoteStore = db.createObjectStore('remotes', { keyPath: 'id' });
        remoteStore.createIndex('repoId', 'repoId', { unique: false });
        remoteStore.createIndex('name', 'name', { unique: false });
      }

      // Create staging store
      if (!db.objectStoreNames.contains('staging')) {
        const stagingStore = db.createObjectStore('staging', { keyPath: 'id' });
        stagingStore.createIndex('repoId', 'repoId', { unique: false });
        stagingStore.createIndex('filePath', 'filePath', { unique: false });
        stagingStore.createIndex('staged', 'staged', { unique: false });
      }
    },
  });
}

/**
 * Repository Operations
 */
export const GitRepositoryDB = {
  async create(repo: Omit<GitRepository, 'createdAt' | 'updatedAt'>): Promise<GitRepository> {
    const db = await openGitDB();
    const now = Date.now();
    const newRepo: GitRepository = {
      ...repo,
      createdAt: now,
      updatedAt: now,
    };
    await db.add('repositories', newRepo);
    return newRepo;
  },

  async get(id: string): Promise<GitRepository | undefined> {
    const db = await openGitDB();
    return db.get('repositories', id);
  },

  async getByFullName(fullName: string): Promise<GitRepository | undefined> {
    const db = await openGitDB();
    return db.getFromIndex('repositories', 'fullName', fullName);
  },

  async list(): Promise<GitRepository[]> {
    const db = await openGitDB();
    return db.getAll('repositories');
  },

  async listByOwner(owner: string): Promise<GitRepository[]> {
    const db = await openGitDB();
    return db.getAllFromIndex('repositories', 'owner', owner);
  },

  async update(id: string, updates: Partial<GitRepository>): Promise<void> {
    const db = await openGitDB();
    const repo = await db.get('repositories', id);
    if (!repo) throw new Error(`Repository ${id} not found`);
    
    const updated: GitRepository = {
      ...repo,
      ...updates,
      updatedAt: Date.now(),
    };
    await db.put('repositories', updated);
  },

  async delete(id: string): Promise<void> {
    const db = await openGitDB();
    await db.delete('repositories', id);
  },
};

/**
 * Commit Operations
 */
export const GitCommitDB = {
  async create(commit: Omit<GitCommit, 'createdAt'>): Promise<GitCommit> {
    const db = await openGitDB();
    const newCommit: GitCommit = {
      ...commit,
      createdAt: Date.now(),
    };
    await db.add('commits', newCommit);
    return newCommit;
  },

  async get(sha: string): Promise<GitCommit | undefined> {
    const db = await openGitDB();
    return db.get('commits', sha);
  },

  async listByRepo(repoId: string, limit?: number): Promise<GitCommit[]> {
    const db = await openGitDB();
    const commits = await db.getAllFromIndex('commits', 'repoId', repoId);
    // Sort by date descending
    commits.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? commits.slice(0, limit) : commits;
  },

  async listByAuthor(author: string): Promise<GitCommit[]> {
    const db = await openGitDB();
    return db.getAllFromIndex('commits', 'author.name', author);
  },

  async delete(sha: string): Promise<void> {
    const db = await openGitDB();
    await db.delete('commits', sha);
  },

  async deleteByRepo(repoId: string): Promise<void> {
    const db = await openGitDB();
    const commits = await db.getAllFromIndex('commits', 'repoId', repoId);
    const tx = db.transaction('commits', 'readwrite');
    await Promise.all(commits.map(commit => tx.store.delete(commit.sha)));
    await tx.done;
  },
};

/**
 * Branch Operations
 */
export const GitBranchDB = {
  async create(branch: Omit<GitBranch, 'createdAt' | 'updatedAt'>): Promise<GitBranch> {
    const db = await openGitDB();
    const now = Date.now();
    const newBranch: GitBranch = {
      ...branch,
      createdAt: now,
      updatedAt: now,
    };
    await db.add('branches', newBranch);
    return newBranch;
  },

  async get(id: string): Promise<GitBranch | undefined> {
    const db = await openGitDB();
    return db.get('branches', id);
  },

  async listByRepo(repoId: string): Promise<GitBranch[]> {
    const db = await openGitDB();
    return db.getAllFromIndex('branches', 'repoId', repoId);
  },

  async getActive(repoId: string): Promise<GitBranch | undefined> {
    const db = await openGitDB();
    const branches = await db.getAllFromIndex('branches', 'repoId', repoId);
    return branches.find(b => b.isActive);
  },

  async setActive(repoId: string, branchId: string): Promise<void> {
    const db = await openGitDB();
    const branches = await db.getAllFromIndex('branches', 'repoId', repoId);
    
    const tx = db.transaction('branches', 'readwrite');
    await Promise.all(
      branches.map(branch => {
        const updated: GitBranch = {
          ...branch,
          isActive: branch.id === branchId,
          updatedAt: Date.now(),
        };
        return tx.store.put(updated);
      })
    );
    await tx.done;
  },

  async update(id: string, updates: Partial<GitBranch>): Promise<void> {
    const db = await openGitDB();
    const branch = await db.get('branches', id);
    if (!branch) throw new Error(`Branch ${id} not found`);
    
    const updated: GitBranch = {
      ...branch,
      ...updates,
      updatedAt: Date.now(),
    };
    await db.put('branches', updated);
  },

  async delete(id: string): Promise<void> {
    const db = await openGitDB();
    await db.delete('branches', id);
  },

  async deleteByRepo(repoId: string): Promise<void> {
    const db = await openGitDB();
    const branches = await db.getAllFromIndex('branches', 'repoId', repoId);
    const tx = db.transaction('branches', 'readwrite');
    await Promise.all(branches.map(branch => tx.store.delete(branch.id)));
    await tx.done;
  },
};

/**
 * Remote Operations
 */
export const GitRemoteDB = {
  async create(remote: Omit<GitRemote, 'createdAt'>): Promise<GitRemote> {
    const db = await openGitDB();
    const newRemote: GitRemote = {
      ...remote,
      createdAt: Date.now(),
    };
    await db.add('remotes', newRemote);
    return newRemote;
  },

  async get(id: string): Promise<GitRemote | undefined> {
    const db = await openGitDB();
    return db.get('remotes', id);
  },

  async listByRepo(repoId: string): Promise<GitRemote[]> {
    const db = await openGitDB();
    return db.getAllFromIndex('remotes', 'repoId', repoId);
  },

  async getByName(repoId: string, name: string): Promise<GitRemote | undefined> {
    const db = await openGitDB();
    const remotes = await db.getAllFromIndex('remotes', 'repoId', repoId);
    return remotes.find(r => r.name === name);
  },

  async delete(id: string): Promise<void> {
    const db = await openGitDB();
    await db.delete('remotes', id);
  },

  async deleteByRepo(repoId: string): Promise<void> {
    const db = await openGitDB();
    const remotes = await db.getAllFromIndex('remotes', 'repoId', repoId);
    const tx = db.transaction('remotes', 'readwrite');
    await Promise.all(remotes.map(remote => tx.store.delete(remote.id)));
    await tx.done;
  },
};

/**
 * Staging Area Operations
 */
export const GitStagingDB = {
  async stage(staging: Omit<GitStaging, 'createdAt' | 'updatedAt'>): Promise<GitStaging> {
    const db = await openGitDB();
    const now = Date.now();
    
    // Check if file already staged
    const existing = await this.getByPath(staging.repoId, staging.filePath);
    if (existing) {
      const updated: GitStaging = {
        ...existing,
        ...staging,
        staged: true,
        updatedAt: now,
      };
      await db.put('staging', updated);
      return updated;
    }
    
    const newStaging: GitStaging = {
      ...staging,
      staged: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.add('staging', newStaging);
    return newStaging;
  },

  async unstage(id: string): Promise<void> {
    const db = await openGitDB();
    await db.delete('staging', id);
  },

  async get(id: string): Promise<GitStaging | undefined> {
    const db = await openGitDB();
    return db.get('staging', id);
  },

  async getByPath(repoId: string, filePath: string): Promise<GitStaging | undefined> {
    const db = await openGitDB();
    const staged = await db.getAllFromIndex('staging', 'repoId', repoId);
    return staged.find(s => s.filePath === filePath);
  },

  async listByRepo(repoId: string): Promise<GitStaging[]> {
    const db = await openGitDB();
    return db.getAllFromIndex('staging', 'repoId', repoId);
  },

  async listStaged(repoId: string): Promise<GitStaging[]> {
    const db = await openGitDB();
    const all = await db.getAllFromIndex('staging', 'repoId', repoId);
    return all.filter(s => s.staged);
  },

  async clearStaging(repoId: string): Promise<void> {
    const db = await openGitDB();
    const staged = await db.getAllFromIndex('staging', 'repoId', repoId);
    const tx = db.transaction('staging', 'readwrite');
    await Promise.all(staged.map(s => tx.store.delete(s.id)));
    await tx.done;
  },
};

/**
 * Utility: Generate UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
