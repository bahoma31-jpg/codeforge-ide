/**
 * CodeForge IDE — Git Tools
 * Agent tools for Git and GitHub operations.
 * 7 tools: status, diff, stage, commit, push, createBranch, createPR.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';

// ─── Tool Definitions ─────────────────────────────────────────

export const gitTools: ToolDefinition[] = [
  {
    name: 'git_status',
    description: 'Get the current Git status — shows which files are modified, staged, or untracked.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    riskLevel: 'auto',
    category: 'git',
  },
  {
    name: 'git_diff',
    description: 'Show the diff (changes) for a specific file or all modified files.',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path of specific file to diff. Omit for all files.',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'git',
  },
  {
    name: 'git_stage',
    description: 'Stage files for commit (add to staging area).',
    parameters: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths to stage. Use ["."] to stage all.',
        },
      },
      required: ['paths'],
    },
    riskLevel: 'notify',
    category: 'git',
  },
  {
    name: 'git_commit',
    description: 'Create a Git commit with the staged changes.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message describing the changes.',
        },
      },
      required: ['message'],
    },
    riskLevel: 'notify',
    category: 'git',
  },
  {
    name: 'git_push',
    description: 'Push committed changes to GitHub remote repository. This is a destructive operation that requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch to push to. Defaults to current branch.',
        },
      },
      required: [],
    },
    riskLevel: 'confirm',
    category: 'git',
  },
  {
    name: 'git_create_branch',
    description: 'Create a new Git branch from the current branch or a specified base.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new branch.',
        },
        fromBranch: {
          type: 'string',
          description: 'Base branch to create from. Defaults to current branch.',
        },
      },
      required: ['name'],
    },
    riskLevel: 'notify',
    category: 'git',
  },
  {
    name: 'git_create_pr',
    description: 'Create a Pull Request on GitHub. This requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the Pull Request.',
        },
        body: {
          type: 'string',
          description: 'Description/body of the Pull Request.',
        },
        base: {
          type: 'string',
          description: 'Base branch to merge into (e.g., "main").',
        },
        head: {
          type: 'string',
          description: 'Branch containing changes.',
        },
      },
      required: ['title', 'base', 'head'],
    },
    riskLevel: 'confirm',
    category: 'git',
  },
];

// ─── Tool Executors ───────────────────────────────────────────

export function registerGitExecutors(service: AgentService): void {
  // git_status
  service.registerToolExecutor('git_status', async () => {
    try {
      // Import git store dynamically to avoid circular deps
      const { useGitStore } = await import('@/lib/stores/git-store');
      const store = useGitStore.getState();

      return {
        success: true,
        data: {
          isRepo: store.isRepo,
          currentBranch: store.currentBranch,
          remoteUrl: store.remoteUrl,
          modifiedFiles: store.modifiedFiles,
          stagedFiles: store.stagedFiles,
          commitHistory: store.commitHistory.slice(0, 5),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_diff
  service.registerToolExecutor('git_diff', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const store = useGitStore.getState();

      // For now, return modified files info
      // Full diff implementation depends on LightningFS integration
      const filePath = args.filePath as string | undefined;
      const modified = filePath
        ? store.modifiedFiles.filter((f: string) => f === filePath)
        : store.modifiedFiles;

      return {
        success: true,
        data: {
          modifiedFiles: modified,
          message: `${modified.length} file(s) modified`,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_stage
  service.registerToolExecutor('git_stage', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const paths = args.paths as string[];

      for (const path of paths) {
        await useGitStore.getState().stageFile(path);
      }

      return {
        success: true,
        data: { staged: paths, message: `${paths.length} file(s) staged` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_commit
  service.registerToolExecutor('git_commit', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const message = args.message as string;

      await useGitStore.getState().commit(message);

      return {
        success: true,
        data: { message: `Committed: ${message}` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_push
  service.registerToolExecutor('git_push', async () => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      await useGitStore.getState().push();

      return {
        success: true,
        data: { message: 'Changes pushed to remote successfully' },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_create_branch
  service.registerToolExecutor('git_create_branch', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const name = args.name as string;

      await useGitStore.getState().createBranch(name);

      return {
        success: true,
        data: { branch: name, message: `Branch '${name}' created` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_create_pr
  service.registerToolExecutor('git_create_pr', async (args) => {
    try {
      // Use GitHub write service
      const { useAuthStore } = await import('@/lib/stores/auth-store');
      const { useGitStore } = await import('@/lib/stores/git-store');
      const token = useAuthStore.getState().token;
      const remoteUrl = useGitStore.getState().remoteUrl;

      if (!token) {
        return { success: false, error: 'Not authenticated with GitHub' };
      }
      if (!remoteUrl) {
        return { success: false, error: 'No remote repository configured' };
      }

      // Extract owner/repo from remote URL
      const match = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (!match) {
        return { success: false, error: 'Invalid GitHub remote URL' };
      }

      const [, owner, repo] = match;
      const title = args.title as string;
      const body = (args.body as string) || '';
      const base = args.base as string;
      const head = args.head as string;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, body, base, head }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to create PR' };
      }

      const pr = await response.json();

      return {
        success: true,
        data: {
          number: pr.number,
          url: pr.html_url,
          title: pr.title,
          message: `PR #${pr.number} created: ${pr.html_url}`,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
