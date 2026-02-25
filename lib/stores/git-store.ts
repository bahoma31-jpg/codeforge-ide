/**
 * Git Store - State management for Git operations
 * 
 * Integrates:
 * - git-db.ts for metadata storage
 * - github-auth.ts for authentication
 * - github.ts for API calls
 * - operations.ts for Git logic
 * - files-store.ts for file management
 * 
 * @module lib/stores/git-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GitHubAuth } from '../git/github-auth';
import { GitHubAPI } from '../git/github';
import type { GitHubUser, GitHubRepository, GitCommit } from '../git/github-types';
import type {
  RepositoryRecord,
  CommitRecord,
  BranchRecord,
  RemoteRecord,
  StagingRecord
} from '../db/git-db';
import * as GitDB from '../db/git-db';
import * as Operations from '../git/operations';
import { getFileStatus, type FileStatus } from '../git/status';
import type { FileNode } from './files-store';

/**
 * Git branch info
 */
export interface GitBranch {
  name: string;
  commitSha: string;
  isRemote: boolean;
  isActive: boolean;
}

/**
 * File status in Git
 */
export interface GitFileStatus {
  path: string;
  status: FileStatus;
  staged: boolean;
}

/**
 * Git status summary
 */
export interface GitStatus {
  modified: GitFileStatus[];
  added: GitFileStatus[];
  deleted: GitFileStatus[];
  staged: GitFileStatus[];
}

/**
 * Git store state
 */
interface GitState {
  // Authentication
  isAuthenticated: boolean;
  user: GitHubUser | null;

  // Current repository
  currentRepo: RepositoryRecord | null;
  currentBranch: string;

  // Branches
  branches: GitBranch[];

  // Status
  status: GitStatus;

  // Commits
  commits: CommitRecord[];

  // UI state
  isLoading: boolean;
  error: string | null;
  cloneProgress: number;

  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;

  cloneRepo: (repoUrl: string) => Promise<void>;
  commitChanges: (message: string) => Promise<void>;
  pushChanges: () => Promise<void>;
  pullChanges: () => Promise<void>;

  switchBranch: (branchName: string) => Promise<void>;
  createBranch: (name: string, fromBranch?: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;

  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;

  getStatus: () => Promise<void>;
  refreshStatus: () => Promise<void>;

  // Utility
  clearError: () => void;
  setCurrentRepo: (repo: RepositoryRecord | null) => void;
}

/**
 * Git store instance
 */
export const useGitStore = create<GitState>()()
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      currentRepo: null,
      currentBranch: 'main',
      branches: [],
      status: {
        modified: [],
        added: [],
        deleted: [],
        staged: []
      },
      commits: [],
      isLoading: false,
      error: null,
      cloneProgress: 0,

      /**
       * Login with GitHub token
       */
      login: async (token: string) => {
        try {
          set({ isLoading: true, error: null });

          // Validate token
          const auth = new GitHubAuth();
          auth.setToken(token);

          // Get user info
          const api = new GitHubAPI(token);
          const user = await api.getUser();

          set({
            isAuthenticated: true,
            user,
            isLoading: false
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
          set({
            isAuthenticated: false,
            user: null,
            error: message,
            isLoading: false
          });
          throw error;
        }
      },

      /**
       * Logout and clear authentication
       */
      logout: () => {
        const auth = new GitHubAuth();
        auth.clearToken();

        set({
          isAuthenticated: false,
          user: null,
          currentRepo: null,
          branches: [],
          commits: [],
          status: {
            modified: [],
            added: [],
            deleted: [],
            staged: []
          }
        });
      },

      /**
       * Clone repository
       */
      cloneRepo: async (repoUrl: string) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Not authenticated');

          set({ isLoading: true, error: null, cloneProgress: 0 });

          // Parse repository URL
          const urlParts = repoUrl.replace('https://github.com/', '').split('/');
          const owner = urlParts[0];
          const repo = urlParts[1]?.replace('.git', '');

          if (!owner || !repo) {
            throw new Error('Invalid repository URL');
          }

          // Get auth token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          // Clone repository
          const files = await Operations.cloneRepository(
            owner,
            repo,
            token,
            'main',
            (progress, message) => {
              set({ cloneProgress: progress });
            }
          );

          // Save to files-store
          const { useFilesStore } = await import('./files-store');
          const filesStore = useFilesStore.getState();

          // Create root folder
          const rootFolder: FileNode = {
            id: repo,
            name: repo,
            type: 'folder',
            path: '/',
            children: files
          };

          filesStore.setFiles([rootFolder]);

          // Get repository info
          const api = new GitHubAPI(token);
          const repoInfo = await api.getRepository(owner, repo);

          // Save repository to DB
          const repoRecord: RepositoryRecord = {
            id: `${owner}/${repo}`,
            name: repo,
            fullName: repoInfo.full_name,
            owner,
            cloneUrl: repoInfo.clone_url,
            defaultBranch: repoInfo.default_branch,
            lastSynced: Date.now(),
            description: repoInfo.description,
            isPrivate: repoInfo.private
          };

          await GitDB.saveRepository(repoRecord);

          // Save main branch
          const mainBranch: BranchRecord = {
            id: `${repoRecord.id}:main`,
            name: 'main',
            repoId: repoRecord.id,
            commitSha: '', // Will be updated on first commit
            isRemote: true,
            isActive: true,
            lastUpdated: Date.now()
          };

          await GitDB.saveBranch(mainBranch);

          // Save origin remote
          const originRemote: RemoteRecord = {
            id: `${repoRecord.id}:origin`,
            name: 'origin',
            repoId: repoRecord.id,
            url: repoInfo.clone_url,
            type: 'both'
          };

          await GitDB.saveRemote(originRemote);

          set({
            currentRepo: repoRecord,
            currentBranch: 'main',
            branches: [{
              name: 'main',
              commitSha: '',
              isRemote: true,
              isActive: true
            }],
            isLoading: false,
            cloneProgress: 100
          });

          // Refresh status
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Clone failed';
          set({
            error: message,
            isLoading: false,
            cloneProgress: 0
          });
          throw error;
        }
      },

      /**
       * Commit staged changes
       */
      commitChanges: async (message: string) => {
        try {
          const { currentRepo, user, status } = get();
          if (!currentRepo || !user) throw new Error('Not authenticated or no repository');

          // Validate message
          const validation = Operations.validateCommitMessage(message);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          set({ isLoading: true, error: null });

          // Get staged files
          const stagedFiles = status.staged;
          if (stagedFiles.length === 0) {
            throw new Error('No files staged for commit');
          }

          // Get files from files-store
          const { useFilesStore } = await import('./files-store');
          const filesStore = useFilesStore.getState();
          const allFiles = filesStore.getAllFiles();

          // Filter to staged files only
          const changedFiles = allFiles.filter(f => 
            stagedFiles.some(sf => sf.path === f.path)
          );

          // Get auth token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          // Parse repo info
          const [owner, repo] = currentRepo.id.split('/');

          // Get current branch HEAD
          const api = new GitHubAPI(token);
          const ref = await api.getRef(owner, repo, `heads/${get().currentBranch}`);
          const parentSha = ref.object.sha;

          // Get parent commit to get tree SHA
          const parentCommit = await api.getCommit(owner, repo, parentSha);

          // Create tree
          const treeSha = await Operations.createCommitTree(
            changedFiles,
            parentCommit.tree.sha,
            owner,
            repo,
            token
          );

          // Create commit
          const commitSha = await Operations.createCommit(
            message,
            treeSha,
            parentSha,
            owner,
            repo,
            token
          );

          // Save commit to DB
          const commitRecord: CommitRecord = {
            sha: commitSha,
            repoId: currentRepo.id,
            message,
            author: {
              name: user.login,
              email: user.email || `${user.login}@users.noreply.github.com`,
              date: new Date().toISOString()
            },
            date: new Date().toISOString(),
            parentShas: [parentSha],
            tree: treeSha
          };

          await GitDB.saveCommit(commitRecord);

          // Clear staging
          await GitDB.clearStaging(currentRepo.id);

          // Update local branch
          await Operations.pushToRemote(owner, repo, get().currentBranch, commitSha, token);

          set({ isLoading: false });

          // Refresh status and commits
          await get().refreshStatus();
          const commits = await GitDB.getCommitsByRepo(currentRepo.id);
          set({ commits });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Commit failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Push changes to remote
       */
      pushChanges: async () => {
        try {
          const { currentRepo, currentBranch } = get();
          if (!currentRepo) throw new Error('No repository');

          set({ isLoading: true, error: null });

          // Get token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          // Get latest local commit
          const commits = await GitDB.getCommitsByRepo(currentRepo.id);
          if (commits.length === 0) {
            throw new Error('No commits to push');
          }

          const latestCommit = commits[0];
          const [owner, repo] = currentRepo.id.split('/');

          // Push
          await Operations.pushToRemote(
            owner,
            repo,
            currentBranch,
            latestCommit.sha,
            token
          );

          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Push failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Pull changes from remote
       */
      pullChanges: async () => {
        try {
          const { currentRepo, currentBranch } = get();
          if (!currentRepo) throw new Error('No repository');

          set({ isLoading: true, error: null });

          // Get token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          const [owner, repo] = currentRepo.id.split('/');

          // Pull files
          const files = await Operations.pullFromRemote(
            owner,
            repo,
            currentBranch,
            token
          );

          // Update files-store
          const { useFilesStore } = await import('./files-store');
          const filesStore = useFilesStore.getState();

          const rootFolder: FileNode = {
            id: repo,
            name: repo,
            type: 'folder',
            path: '/',
            children: files
          };

          filesStore.setFiles([rootFolder]);

          set({ isLoading: false });

          // Refresh status
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Pull failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Switch to different branch
       */
      switchBranch: async (branchName: string) => {
        try {
          const { currentRepo } = get();
          if (!currentRepo) throw new Error('No repository');

          set({ isLoading: true, error: null });

          // Update active branch in DB
          await GitDB.setActiveBranch(currentRepo.id, branchName);

          // Get updated branches
          const branchRecords = await GitDB.getBranchesByRepo(currentRepo.id);
          const branches = branchRecords.map(b => ({
            name: b.name,
            commitSha: b.commitSha,
            isRemote: b.isRemote,
            isActive: b.isActive
          }));

          set({
            currentBranch: branchName,
            branches,
            isLoading: false
          });

          // Refresh status
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Branch switch failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Create new branch
       */
      createBranch: async (name: string, fromBranch?: string) => {
        try {
          const { currentRepo, currentBranch } = get();
          if (!currentRepo) throw new Error('No repository');

          // Validate name
          const validation = Operations.validateBranchName(name);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          set({ isLoading: true, error: null });

          // Get token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          const [owner, repo] = currentRepo.id.split('/');
          const sourceBranch = fromBranch || currentBranch;

          // Get source branch SHA
          const api = new GitHubAPI(token);
          const ref = await api.getRef(owner, repo, `heads/${sourceBranch}`);

          // Create branch
          await Operations.createBranch(owner, repo, name, ref.object.sha, token);

          // Save to DB
          const newBranch: BranchRecord = {
            id: `${currentRepo.id}:${name}`,
            name,
            repoId: currentRepo.id,
            commitSha: ref.object.sha,
            isRemote: true,
            isActive: false,
            lastUpdated: Date.now()
          };

          await GitDB.saveBranch(newBranch);

          // Refresh branches
          const branchRecords = await GitDB.getBranchesByRepo(currentRepo.id);
          const branches = branchRecords.map(b => ({
            name: b.name,
            commitSha: b.commitSha,
            isRemote: b.isRemote,
            isActive: b.isActive
          }));

          set({ branches, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Branch creation failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Delete branch
       */
      deleteBranch: async (name: string) => {
        try {
          const { currentRepo, currentBranch } = get();
          if (!currentRepo) throw new Error('No repository');
          if (name === currentBranch) {
            throw new Error('Cannot delete active branch');
          }

          set({ isLoading: true, error: null });

          // Get token
          const auth = new GitHubAuth();
          const token = auth.getToken();
          if (!token) throw new Error('No authentication token');

          const [owner, repo] = currentRepo.id.split('/');

          // Delete from remote
          await Operations.deleteBranch(owner, repo, name, token);

          // Delete from DB
          await GitDB.deleteBranch(`${currentRepo.id}:${name}`);

          // Refresh branches
          const branchRecords = await GitDB.getBranchesByRepo(currentRepo.id);
          const branches = branchRecords.map(b => ({
            name: b.name,
            commitSha: b.commitSha,
            isRemote: b.isRemote,
            isActive: b.isActive
          }));

          set({ branches, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Branch deletion failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Stage file for commit
       */
      stageFile: async (path: string) => {
        try {
          const { currentRepo } = get();
          if (!currentRepo) throw new Error('No repository');

          // Get file from files-store
          const { useFilesStore } = await import('./files-store');
          const filesStore = useFilesStore.getState();
          const file = filesStore.getFileByPath(path);

          if (!file) throw new Error('File not found');

          // Create staging record
          const stagingRecord: StagingRecord = {
            id: `${currentRepo.id}:${path}`,
            repoId: currentRepo.id,
            filePath: path,
            status: 'modified', // Simplified for now
            modifiedContent: file.content,
            stagedAt: Date.now()
          };

          await GitDB.stageFile(stagingRecord);

          // Refresh status
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Stage failed';
          set({ error: message });
          throw error;
        }
      },

      /**
       * Unstage file
       */
      unstageFile: async (path: string) => {
        try {
          const { currentRepo } = get();
          if (!currentRepo) throw new Error('No repository');

          await GitDB.unstageFile(`${currentRepo.id}:${path}`);

          // Refresh status
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unstage failed';
          set({ error: message });
          throw error;
        }
      },

      /**
       * Stage all changed files
       */
      stageAll: async () => {
        try {
          const { status } = get();
          const allChanges = [
            ...status.modified,
            ...status.added,
            ...status.deleted
          ];

          for (const file of allChanges) {
            if (!file.staged) {
              await get().stageFile(file.path);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Stage all failed';
          set({ error: message });
          throw error;
        }
      },

      /**
       * Unstage all files
       */
      unstageAll: async () => {
        try {
          const { currentRepo } = get();
          if (!currentRepo) throw new Error('No repository');

          await GitDB.clearStaging(currentRepo.id);
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unstage all failed';
          set({ error: message });
          throw error;
        }
      },

      /**
       * Get Git status
       */
      getStatus: async () => {
        await get().refreshStatus();
      },

      /**
       * Refresh Git status
       */
      refreshStatus: async () => {
        try {
          const { currentRepo } = get();
          if (!currentRepo) return;

          // Get current files
          const { useFilesStore } = await import('./files-store');
          const filesStore = useFilesStore.getState();
          const currentFiles = filesStore.getAllFiles();

          // Get last commit files (stub for now)
          const lastCommitFiles: FileNode[] = [];

          // Calculate status
          const gitStatus = Operations.calculateStatus(currentFiles, lastCommitFiles);

          // Get staged files
          const stagedRecords = await GitDB.getStagedFiles(currentRepo.id);
          const stagedPaths = new Set(stagedRecords.map(r => r.filePath));

          // Build status
          const status: GitStatus = {
            modified: gitStatus.modified.map(path => ({
              path,
              status: 'modified' as FileStatus,
              staged: stagedPaths.has(path)
            })),
            added: gitStatus.added.map(path => ({
              path,
              status: 'added' as FileStatus,
              staged: stagedPaths.has(path)
            })),
            deleted: gitStatus.deleted.map(path => ({
              path,
              status: 'deleted' as FileStatus,
              staged: stagedPaths.has(path)
            })),
            staged: [...stagedRecords].map(r => ({
              path: r.filePath,
              status: r.status as FileStatus,
              staged: true
            }))
          };

          set({ status });
        } catch (error) {
          console.error('Error refreshing status:', error);
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set current repository
       */
      setCurrentRepo: (repo: RepositoryRecord | null) => {
        set({ currentRepo: repo });
      }
    }),
    {
      name: 'git-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        currentRepo: state.currentRepo,
        currentBranch: state.currentBranch
      })
    }
  );
