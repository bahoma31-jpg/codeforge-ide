/**
 * CodeForge IDE - Git Store
 * Agent 5: Phase 2 - Task 2
 * 
 * Zustand store for Git state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GitHubAuth } from '../api/github-auth';
import { GitHubAPI } from '../api/github';
import type { GitHubUser, GitHubRepository } from '../api/github-types';
import {
  initializeGitDB,
  saveRepository,
  getRepository,
  getAllRepositories,
  deleteRepository,
  saveBranch,
  getBranchesByRepo,
  getActiveBranch,
  setActiveBranch,
  deleteBranch as dbDeleteBranch,
  saveCommit,
  getCommitsByRepo,
  getStagedFiles,
  stageFile as dbStageFile,
  unstageFile as dbUnstageFile,
  clearStagingArea,
  type GitRepository,
  type GitBranch,
  type GitCommit,
  type GitStagingEntry
} from '../db/git-db';
import { useFilesStore } from './files-store';
import type { FileNode } from '../db/schema';
import {
  cloneRepository,
  calculateStatus,
  createCommitTree,
  createCommit,
  pushToRemote,
  pullFromRemote,
  type GitStatus,
  type FileChange
} from '../git/operations';

/**
 * Git store state
 */
interface GitState {
  // Authentication
  isAuthenticated: boolean;
  user: GitHubUser | null;
  token: string | null;

  // Current repository
  currentRepo: GitRepository | null;
  currentBranch: string;
  branches: GitBranch[];

  // Status
  status: GitStatus;
  commits: GitCommit[];
  stagedFiles: GitStagingEntry[];

  // UI State
  isLoading: boolean;
  error: string | null;
  cloneProgress: number; // 0-100
  isInitialized: boolean;

  // Actions - Authentication
  initialize: () => Promise<void>;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;

  // Actions - Repository
  cloneRepo: (repoUrl: string) => Promise<void>;
  openRepo: (repoId: string) => Promise<void>;
  closeRepo: () => void;
  deleteRepo: (repoId: string) => Promise<void>;

  // Actions - Commits
  commitChanges: (message: string) => Promise<void>;
  pushChanges: () => Promise<void>;
  pullChanges: () => Promise<void>;
  refreshCommits: () => Promise<void>;

  // Actions - Branches
  switchBranch: (branchName: string) => Promise<void>;
  createBranch: (name: string, fromBranch?: string) => Promise<void>;
  removeBranch: (name: string) => Promise<void>;
  refreshBranches: () => Promise<void>;

  // Actions - Staging
  addToStaging: (path: string) => Promise<void>;
  removeFromStaging: (path: string) => Promise<void>;
  getStatus: () => Promise<void>;
  refreshStatus: () => Promise<void>;

  // UI Actions
  clearError: () => void;
}

/**
 * Git store implementation
 */
export const useGitStore = create<GitState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      currentRepo: null,
      currentBranch: 'main',
      branches: [],
      status: { modified: [], added: [], deleted: [], staged: [] },
      commits: [],
      stagedFiles: [],
      isLoading: false,
      error: null,
      cloneProgress: 0,
      isInitialized: false,

      // Initialize
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });
        try {
          await initializeGitDB();

          // Restore authentication if token exists
          const { token } = get();
          if (token) {
            try {
              const auth = new GitHubAuth(token);
              const user = await auth.getUser();
              set({ isAuthenticated: true, user });
            } catch (error) {
              // Token invalid, clear authentication
              set({ isAuthenticated: false, user: null, token: null });
            }
          }

          set({ isInitialized: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to initialize Git';
          set({ error: message });
          console.error('Git initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Login
      login: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const auth = new GitHubAuth(token);
          const user = await auth.getUser();
          set({ isAuthenticated: true, user, token });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Logout
      logout: async () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          currentRepo: null,
          currentBranch: 'main',
          branches: [],
          status: { modified: [], added: [], deleted: [], staged: [] },
          commits: [],
          stagedFiles: []
        });
      },

      // Clone repository
      cloneRepo: async (repoUrl: string) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null, cloneProgress: 0 });
        try {
          // Parse repository URL
          const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
          if (!match) throw new Error('Invalid GitHub repository URL');

          const [, owner, repo] = match;
          const api = new GitHubAPI(token);

          // Get repository info
          set({ cloneProgress: 10 });
          const repoInfo = await api.getRepository(owner, repo);

          // Clone repository files
          const files = await cloneRepository(
            owner,
            repo,
            token,
            (progress) => set({ cloneProgress: 10 + progress * 0.8 })
          );

          // Save to files store
          set({ cloneProgress: 95 });
          const filesStore = useFilesStore.getState();
          for (const file of files) {
            if (file.type === 'file') {
              await filesStore.createFile(
                file.name,
                file.parentId,
                file.content,
                file.language
              );
            } else {
              await filesStore.createFolder(file.name, file.parentId);
            }
          }

          // Save repository metadata
          const repository: GitRepository = {
            id: `${owner}/${repo}`,
            name: repo,
            fullName: `${owner}/${repo}`,
            owner,
            cloneUrl: repoInfo.clone_url,
            defaultBranch: repoInfo.default_branch,
            lastSynced: Date.now(),
            description: repoInfo.description,
            isPrivate: repoInfo.private
          };
          await saveRepository(repository);

          // Save default branch
          const branch: GitBranch = {
            name: repoInfo.default_branch,
            repoId: repository.id,
            commitSha: '', // Will be updated on first commit
            isRemote: true,
            isActive: true
          };
          await saveBranch(branch);

          set({
            currentRepo: repository,
            currentBranch: repoInfo.default_branch,
            branches: [branch],
            cloneProgress: 100
          });

          // Refresh commits and status
          await get().refreshCommits();
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to clone repository';
          set({ error: message, cloneProgress: 0 });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Open existing repository
      openRepo: async (repoId: string) => {
        set({ isLoading: true, error: null });
        try {
          const repo = await getRepository(repoId);
          if (!repo) throw new Error('Repository not found');

          const branches = await getBranchesByRepo(repoId);
          const activeBranch = await getActiveBranch(repoId);

          set({
            currentRepo: repo,
            currentBranch: activeBranch?.name || repo.defaultBranch,
            branches
          });

          await get().refreshCommits();
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to open repository';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Close repository
      closeRepo: () => {
        set({
          currentRepo: null,
          currentBranch: 'main',
          branches: [],
          status: { modified: [], added: [], deleted: [], staged: [] },
          commits: [],
          stagedFiles: []
        });
      },

      // Delete repository
      deleteRepo: async (repoId: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteRepository(repoId);
          if (get().currentRepo?.id === repoId) {
            get().closeRepo();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete repository';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Commit changes
      commitChanges: async (message: string) => {
        const { currentRepo, token, stagedFiles } = get();
        if (!currentRepo || !token) throw new Error('No repository open or not authenticated');
        if (stagedFiles.length === 0) throw new Error('No files staged for commit');

        set({ isLoading: true, error: null });
        try {
          const [owner, repo] = currentRepo.fullName.split('/');
          const api = new GitHubAPI(token);

          // Get base tree from last commit
          const commits = await getCommitsByRepo(currentRepo.id);
          const lastCommit = commits[0];
          const baseTreeSha = lastCommit?.treeSha || null;

          // Prepare file changes
          const changes: FileChange[] = stagedFiles.map(entry => ({
            path: entry.filePath,
            content: entry.modifiedContent || '',
            status: entry.status
          }));

          // Create commit tree
          const treeSha = await createCommitTree(changes, baseTreeSha, token, owner, repo);

          // Create commit
          const commitSha = await createCommit(
            message,
            treeSha,
            lastCommit?.sha || null,
            token,
            owner,
            repo
          );

          // Save commit to database
          const commit: GitCommit = {
            sha: commitSha,
            repoId: currentRepo.id,
            message,
            author: get().user?.login || 'Unknown',
            authorEmail: get().user?.email,
            date: Date.now(),
            parentShas: lastCommit ? [lastCommit.sha] : [],
            treeSha
          };
          await saveCommit(commit);

          // Clear staging area
          await clearStagingArea(currentRepo.id);

          set({ stagedFiles: [] });
          await get().refreshCommits();
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to commit changes';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Push changes
      pushChanges: async () => {
        const { currentRepo, currentBranch, token } = get();
        if (!currentRepo || !token) throw new Error('No repository open or not authenticated');

        set({ isLoading: true, error: null });
        try {
          const [owner, repo] = currentRepo.fullName.split('/');
          const commits = await getCommitsByRepo(currentRepo.id);
          const lastCommit = commits[0];

          if (!lastCommit) throw new Error('No commits to push');

          await pushToRemote(owner, repo, currentBranch, lastCommit.sha, token);

          // Update repository last synced
          const updatedRepo = { ...currentRepo, lastSynced: Date.now() };
          await saveRepository(updatedRepo);
          set({ currentRepo: updatedRepo });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to push changes';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Pull changes
      pullChanges: async () => {
        const { currentRepo, currentBranch, token } = get();
        if (!currentRepo || !token) throw new Error('No repository open or not authenticated');

        set({ isLoading: true, error: null });
        try {
          const [owner, repo] = currentRepo.fullName.split('/');
          const updatedFiles = await pullFromRemote(owner, repo, currentBranch, token);

          // Update files in files store
          const filesStore = useFilesStore.getState();
          for (const file of updatedFiles) {
            const existingNode = filesStore.nodes.find(n => n.path === file.path);
            if (existingNode) {
              await filesStore.updateFile(existingNode.id, { content: file.content });
            } else if (file.type === 'file') {
              await filesStore.createFile(
                file.name,
                file.parentId,
                file.content,
                file.language
              );
            }
          }

          // Update repository last synced
          const updatedRepo = { ...currentRepo, lastSynced: Date.now() };
          await saveRepository(updatedRepo);
          set({ currentRepo: updatedRepo });

          await get().refreshCommits();
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to pull changes';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh commits
      refreshCommits: async () => {
        const { currentRepo } = get();
        if (!currentRepo) return;

        try {
          const commits = await getCommitsByRepo(currentRepo.id);
          set({ commits });
        } catch (error) {
          console.error('Failed to refresh commits:', error);
        }
      },

      // Switch branch
      switchBranch: async (branchName: string) => {
        const { currentRepo } = get();
        if (!currentRepo) throw new Error('No repository open');

        set({ isLoading: true, error: null });
        try {
          await setActiveBranch(currentRepo.id, branchName);
          set({ currentBranch: branchName });
          await get().refreshBranches();
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to switch branch';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Create branch
      createBranch: async (name: string, fromBranch?: string) => {
        const { currentRepo, currentBranch } = get();
        if (!currentRepo) throw new Error('No repository open');

        set({ isLoading: true, error: null });
        try {
          const sourceBranch = fromBranch || currentBranch;
          const sourceData = await getActiveBranch(currentRepo.id);

          const branch: GitBranch = {
            name,
            repoId: currentRepo.id,
            commitSha: sourceData?.commitSha || '',
            isRemote: false,
            isActive: false
          };
          await saveBranch(branch);
          await get().refreshBranches();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create branch';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Remove branch
      removeBranch: async (name: string) => {
        const { currentRepo, currentBranch } = get();
        if (!currentRepo) throw new Error('No repository open');
        if (name === currentBranch) throw new Error('Cannot delete active branch');

        set({ isLoading: true, error: null });
        try {
          await dbDeleteBranch(currentRepo.id, name);
          await get().refreshBranches();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete branch';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh branches
      refreshBranches: async () => {
        const { currentRepo } = get();
        if (!currentRepo) return;

        try {
          const branches = await getBranchesByRepo(currentRepo.id);
          set({ branches });
        } catch (error) {
          console.error('Failed to refresh branches:', error);
        }
      },

      // Add to staging
      addToStaging: async (path: string) => {
        const { currentRepo } = get();
        if (!currentRepo) throw new Error('No repository open');

        try {
          // Get file content from files store
          const filesStore = useFilesStore.getState();
          const node = filesStore.nodes.find(n => n.path === path);
          if (!node || node.type !== 'file') throw new Error('File not found');

          const entry: GitStagingEntry = {
            repoId: currentRepo.id,
            filePath: path,
            status: 'modified', // Will be calculated properly in getStatus
            modifiedContent: node.content
          };
          await dbStageFile(entry);

          const stagedFiles = await getStagedFiles(currentRepo.id);
          set({ stagedFiles });
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to stage file';
          set({ error: message });
          throw error;
        }
      },

      // Remove from staging
      removeFromStaging: async (path: string) => {
        const { currentRepo } = get();
        if (!currentRepo) throw new Error('No repository open');

        try {
          await dbUnstageFile(currentRepo.id, path);
          const stagedFiles = await getStagedFiles(currentRepo.id);
          set({ stagedFiles });
          await get().refreshStatus();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to unstage file';
          set({ error: message });
          throw error;
        }
      },

      // Get status
      getStatus: async () => {
        const { currentRepo } = get();
        if (!currentRepo) return;

        try {
          // Get local files from files store
          const filesStore = useFilesStore.getState();
          const localFiles = filesStore.nodes
            .filter(n => n.type === 'file')
            .map(n => ({
              path: n.path,
              content: n.content || '',
              name: n.name,
              parentId: n.parentId
            }));

          // Get last commit files (simplified - in real implementation would fetch from commit tree)
          const commits = await getCommitsByRepo(currentRepo.id);
          const lastCommitFiles = []; // TODO: Fetch from commit tree

          // Calculate status
          const status = calculateStatus(localFiles, lastCommitFiles);

          // Get staged files
          const stagedFiles = await getStagedFiles(currentRepo.id);

          set({ status, stagedFiles });
        } catch (error) {
          console.error('Failed to get status:', error);
        }
      },

      // Refresh status
      refreshStatus: async () => {
        await get().getStatus();
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'git-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token
      })
    }
  )
);
