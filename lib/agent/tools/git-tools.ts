/**
 * CodeForge IDE — Git Tools (with Store Bridge)
 * Agent tools for Git version control operations.
 * All operations sync git-store state after execution.
 *
 * v2.0 — Added git_log tool to match System Prompt v2.0.
 *         All tool names now aligned with prompt sections.
 *
 * 8 tools: git_status, git_diff, git_log, git_stage, git_commit,
 *          git_push, git_create_branch, git_create_pr.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import { refreshGitState, sendNotification } from '../bridge';

// ─── Tool Definitions ─────────────────────────────────────────

export const gitTools: ToolDefinition[] = [
  {
    name: 'git_status',
    description:
      'Get the current Git status — shows which files are modified, staged, or untracked.',
    parameters: { type: 'object', properties: {}, required: [] },
    riskLevel: 'auto',
    category: 'git',
  },
  {
    name: 'git_diff',
    description:
      'Show the diff (changes) for a specific file or all modified files. Returns the actual content differences.',
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
  // ── NEW: git_log — Show recent commit history ──
  {
    name: 'git_log',
    description:
      'Show recent commit log from the local Git repository. Returns commit messages, SHAs, authors, and dates.',
    parameters: {
      type: 'object',
      properties: {
        maxCount: {
          type: 'number',
          description: 'Maximum number of commits to return. Defaults to 10.',
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
    description:
      'Push committed changes to GitHub remote repository. Requires user confirmation.',
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
    description:
      'Create a new local Git branch from the current branch or a specified base.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new branch.',
        },
        fromBranch: {
          type: 'string',
          description:
            'Base branch to create from. Defaults to current branch.',
        },
      },
      required: ['name'],
    },
    riskLevel: 'notify',
    category: 'git',
  },
  {
    name: 'git_create_pr',
    description:
      'Create a Pull Request on GitHub from a local branch. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the Pull Request.' },
        body: {
          type: 'string',
          description: 'Description/body of the Pull Request.',
        },
        base: {
          type: 'string',
          description: 'Base branch to merge into (e.g., "main").',
        },
        head: { type: 'string', description: 'Branch containing changes.' },
      },
      required: ['title', 'base', 'head'],
    },
    riskLevel: 'confirm',
    category: 'git',
  },
];

// ─── Tool Executors (with Store Bridge) ───────────────────────

export function registerGitExecutors(service: AgentService): void {
  // git_status — reads live state from git-store
  service.registerToolExecutor('git_status', async () => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const store = useGitStore.getState();

      return {
        success: true,
        data: {
          isRepo: store.isRepo,
          currentBranch: store.currentBranch,
          remoteUrl: store.remoteUrl,
          modifiedFiles: store.modifiedFiles || [],
          stagedFiles: store.stagedFiles || [],
          commitCount: (store.commitHistory || []).length,
          latestCommits: (store.commitHistory || [])
            .slice(0, 5)
            .map((c: unknown) => ({
              message: c.message || c.commit?.message,
              sha: (c.sha || c.oid || '').slice(0, 7),
            })),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_diff — shows actual content differences
  service.registerToolExecutor('git_diff', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const store = useGitStore.getState();
      const filePath = args.filePath as string | undefined;

      const modifiedFiles = filePath
        ? (store.modifiedFiles || []).filter((f: string) => f === filePath)
        : store.modifiedFiles || [];

      // Try to get actual diff content from the store
      const diffs: Array<{ file: string; status: string; diff?: string }> = [];

      for (const file of modifiedFiles) {
        let diffContent: string | undefined;

        // Try to get diff via store method if available
        const storeWithDiff = store as {
          getDiff?: (file: string) => Promise<string>;
        };
        if (typeof storeWithDiff.getDiff === 'function') {
          try {
            diffContent = await storeWithDiff.getDiff(file);
          } catch {
            /* fallback below */
          }
        }

        // If no diff method, try reading current file content
        if (!diffContent) {
          try {
            const { readFileByPath } = await import('@/lib/db/file-operations');
            const currentFile = await readFileByPath(file);
            diffContent = `[Current content - ${(currentFile.content || '').length} chars]\n${(currentFile.content || '').slice(0, 500)}`;
          } catch {
            /* file might not exist in DB */
          }
        }

        diffs.push({
          file,
          status: 'modified',
          diff: diffContent || '[diff unavailable]',
        });
      }

      return {
        success: true,
        data: {
          totalModified: modifiedFiles.length,
          files: diffs,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── NEW EXECUTOR: git_log — Show recent commit history ──
  service.registerToolExecutor('git_log', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const store = useGitStore.getState();
      const maxCount = (args.maxCount as number) || 10;

      const history = (store.commitHistory || []).slice(0, maxCount);

      const commits = history.map((c: unknown) => {
        const commit = c.commit || c;
        const author = commit.author || c.author || {};
        return {
          sha: (c.sha || c.oid || '').slice(0, 7),
          fullSha: c.sha || c.oid || '',
          message: commit.message || c.message || '',
          author: author.name || author.login || '',
          email: author.email || '',
          date: author.date || author.timestamp || c.date || '',
        };
      });

      return {
        success: true,
        data: {
          branch: store.currentBranch || 'unknown',
          count: commits.length,
          commits,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_stage — stages files then refreshes state
  service.registerToolExecutor('git_stage', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const paths = args.paths as string[];

      for (const path of paths) {
        await useGitStore.getState().stageFile(path);
      }

      // ★ Refresh git state so UI updates
      await refreshGitState();

      await sendNotification(
        `🤖 تم تجهيز ${paths.length} ملف(ات) للحفظ`,
        'info'
      );

      return {
        success: true,
        data: { staged: paths, message: `${paths.length} file(s) staged` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_commit — commits then refreshes
  service.registerToolExecutor('git_commit', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const message = args.message as string;

      await useGitStore.getState().commit(message);

      // ★ Refresh git state
      await refreshGitState();

      await sendNotification(`🤖 تم الحفظ: ${message}`, 'success');

      return {
        success: true,
        data: { message: `Committed: ${message}` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_push — pushes then refreshes
  service.registerToolExecutor('git_push', async () => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      await useGitStore.getState().push();

      // ★ Refresh git state
      await refreshGitState();

      await sendNotification('🤖 تم الدفع إلى GitHub بنجاح', 'success');

      return {
        success: true,
        data: { message: 'Changes pushed to remote successfully' },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_create_branch — creates branch then refreshes
  service.registerToolExecutor('git_create_branch', async (args) => {
    try {
      const { useGitStore } = await import('@/lib/stores/git-store');
      const name = args.name as string;

      await useGitStore.getState().createBranch(name);

      // ★ Refresh git state
      await refreshGitState();

      await sendNotification(`🤖 تم إنشاء فرع: ${name}`, 'success');

      return {
        success: true,
        data: { branch: name, message: `Branch '${name}' created` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // git_create_pr — creates PR via GitHub API
  service.registerToolExecutor('git_create_pr', async (args) => {
    try {
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

      const match = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (!match) {
        return { success: false, error: 'Invalid GitHub remote URL' };
      }

      const [, owner, repo] = match;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: args.title as string,
            body: (args.body as string) || '',
            base: args.base as string,
            head: args.head as string,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to create PR',
        };
      }

      const pr = await response.json();

      await sendNotification(
        `🤖 تم إنشاء PR #${pr.number}: ${pr.title}`,
        'success'
      );

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
