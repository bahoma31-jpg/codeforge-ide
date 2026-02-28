/**
 * CodeForge IDE — GitHub API Tools
 * Agent tools for direct GitHub repository operations.
 * Uses GitHub REST API with Personal Access Token.
 *
 * 25 tools: create_repo, delete_repo, list_repos, push_file, push_files,
 *           read_file, edit_file, delete_file, list_files, create_branch,
 *           list_branches, delete_branch, create_pull_request, list_pull_requests,
 *           get_pull_request, merge_pull_request, create_issue, list_issues,
 *           update_issue, add_comment, get_repo_info, get_user_info,
 *           search_repos, search_code, get_commit_history.
 *
 * الدوال المساعدة المشتركة مستخرجة في: github/shared.ts
 */

import type { ToolDefinition } from '../types';
import type { AgentService } from '../agent-service';
import { sendNotification } from '../bridge/store-bridge';
import {
  TOOL_LIMITATIONS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getGitHubToken,
  getAuthenticatedUsername,
  githubFetch,
  githubFetchRaw,
  GitHubApiError,
} from './github/shared';

// Re-export shared utilities for backward compatibility
export { TOOL_LIMITATIONS } from './github/shared';

// ─── Tool Definitions ─────────────────────────────────────────

export const githubTools: ToolDefinition[] = [
  // ============== REPOSITORY TOOLS ==============
  {
    name: 'github_create_repo',
    description:
      'Create a new GitHub repository. Can create public or private repos with optional initialization (README, .gitignore, license).',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name (e.g., "my-project").',
        },
        description: {
          type: 'string',
          description: 'Short description of the repository.',
        },
        isPrivate: {
          type: 'boolean',
          description:
            'Whether the repo should be private. Defaults to false (public).',
        },
        autoInit: {
          type: 'boolean',
          description: 'Initialize with a README. Defaults to true.',
        },
        gitignoreTemplate: {
          type: 'string',
          description: 'Gitignore template (e.g., "Node", "Python"). Optional.',
        },
      },
      required: ['name'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_delete_repo',
    description:
      'Delete a GitHub repository permanently. This action is IRREVERSIBLE and will delete all code, issues, PRs, and settings. Requires user confirmation. The owner is auto-detected from the GitHub token if not provided or incorrect.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description:
            'Repository owner (username or org). Auto-detected from token if empty or incorrect.',
        },
        repo: { type: 'string', description: 'Repository name to delete.' },
      },
      required: ['repo'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_list_repos',
    description:
      'List GitHub repositories for the authenticated user. Returns repo names, URLs, and basic info.',
    parameters: {
      type: 'object',
      properties: {
        sort: {
          type: 'string',
          description: 'Sort by: "created", "updated", "pushed", "full_name".',
          enum: ['created', 'updated', 'pushed', 'full_name'],
        },
        perPage: {
          type: 'number',
          description: 'Number of repos to return (max 100). Defaults to 10.',
        },
      },
      required: [],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_get_repo_info',
    description:
      'Get detailed information about a GitHub repository including stats, default branch, and description.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_search_repos',
    description:
      'Search for GitHub repositories by keyword, language, topic, or other criteria.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query.' },
        sort: {
          type: 'string',
          description: 'Sort by.',
          enum: ['stars', 'forks', 'updated', 'help-wanted-issues'],
        },
        perPage: {
          type: 'number',
          description: 'Number of results (max 30). Defaults to 5.',
        },
      },
      required: ['query'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== FILE TOOLS ==============
  {
    name: 'github_push_file',
    description: 'Create or update a single file in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path in the repo.' },
        content: { type: 'string', description: 'File content.' },
        message: { type: 'string', description: 'Commit message.' },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'path', 'content', 'message'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_push_files',
    description:
      'Push multiple files to a GitHub repository in a single commit.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path.' },
              content: { type: 'string', description: 'File content.' },
            },
            required: ['path', 'content'],
          },
          description: 'Array of files to push.',
        },
        message: { type: 'string', description: 'Commit message.' },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'files', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_read_file',
    description: 'Read the content of a file from a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path.' },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'path'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_edit_file',
    description:
      'Edit an existing file by replacing a specific text section. ALWAYS read the file first.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path.' },
        old_str: {
          type: 'string',
          description: 'Exact text to find and replace.',
        },
        new_str: { type: 'string', description: 'Replacement text.' },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
        message: { type: 'string', description: 'Commit message.' },
      },
      required: ['owner', 'repo', 'path', 'old_str', 'new_str', 'message'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_delete_file',
    description: 'Delete a file from a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path to delete.' },
        message: { type: 'string', description: 'Commit message.' },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'path', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_list_files',
    description: 'List files and directories in a path of a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: {
          type: 'string',
          description: 'Directory path. Defaults to root.',
        },
        branch: { type: 'string', description: 'Branch. Defaults to "main".' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== BRANCH TOOLS ==============
  {
    name: 'github_create_branch',
    description: 'Create a new branch in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: { type: 'string', description: 'Name of the new branch.' },
        fromBranch: {
          type: 'string',
          description: 'Source branch. Defaults to "main".',
        },
      },
      required: ['owner', 'repo', 'branch'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_list_branches',
    description: 'List all branches in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_delete_branch',
    description: 'Delete a branch from a GitHub repository. Irreversible.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: { type: 'string', description: 'Branch name to delete.' },
      },
      required: ['owner', 'repo', 'branch'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },

  // ============== PULL REQUEST TOOLS ==============
  {
    name: 'github_create_pull_request',
    description: 'Create a Pull Request in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        title: { type: 'string', description: 'PR title.' },
        body: { type: 'string', description: 'PR description.' },
        head: { type: 'string', description: 'Branch with changes.' },
        base: { type: 'string', description: 'Target branch.' },
        draft: { type: 'boolean', description: 'Create as draft.' },
      },
      required: ['owner', 'repo', 'title', 'head', 'base'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_list_pull_requests',
    description: 'List pull requests in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        state: {
          type: 'string',
          description: 'Filter by state.',
          enum: ['open', 'closed', 'all'],
        },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_get_pull_request',
    description: 'Get detailed information about a specific pull request.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        pullNumber: { type: 'number', description: 'Pull request number.' },
      },
      required: ['owner', 'repo', 'pullNumber'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_merge_pull_request',
    description: 'Merge a pull request in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        pullNumber: { type: 'number', description: 'Pull request number.' },
        mergeMethod: {
          type: 'string',
          description: 'Merge method.',
          enum: ['merge', 'squash', 'rebase'],
        },
        commitTitle: {
          type: 'string',
          description: 'Custom merge commit title.',
        },
        commitMessage: {
          type: 'string',
          description: 'Custom merge commit message.',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },

  // ============== ISSUE TOOLS ==============
  {
    name: 'github_create_issue',
    description: 'Create a new issue in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        title: { type: 'string', description: 'Issue title.' },
        body: { type: 'string', description: 'Issue description.' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add.',
        },
      },
      required: ['owner', 'repo', 'title'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_list_issues',
    description: 'List issues in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        state: {
          type: 'string',
          description: 'Filter by state.',
          enum: ['open', 'closed', 'all'],
        },
        labels: { type: 'string', description: 'Comma-separated labels.' },
        sort: {
          type: 'string',
          description: 'Sort by.',
          enum: ['created', 'updated', 'comments'],
        },
        perPage: {
          type: 'number',
          description: 'Number of issues. Defaults to 10.',
        },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_update_issue',
    description: 'Update an existing issue.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        issueNumber: { type: 'number', description: 'Issue number.' },
        title: { type: 'string', description: 'New title.' },
        body: { type: 'string', description: 'New body.' },
        state: {
          type: 'string',
          description: 'New state.',
          enum: ['open', 'closed'],
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated labels.',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated assignees.',
        },
      },
      required: ['owner', 'repo', 'issueNumber'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_add_comment',
    description: 'Add a comment to an issue or pull request.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        issueNumber: { type: 'number', description: 'Issue or PR number.' },
        body: { type: 'string', description: 'Comment text.' },
      },
      required: ['owner', 'repo', 'issueNumber', 'body'],
    },
    riskLevel: 'notify',
    category: 'github',
  },

  // ============== SEARCH TOOLS ==============
  {
    name: 'github_search_code',
    description: 'Search for code patterns across a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        query: { type: 'string', description: 'Search query.' },
        fileExtension: { type: 'string', description: 'Filter by extension.' },
        path: { type: 'string', description: 'Filter by directory.' },
        perPage: {
          type: 'number',
          description: 'Results (max 30). Defaults to 10.',
        },
      },
      required: ['owner', 'repo', 'query'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== HISTORY TOOLS ==============
  {
    name: 'github_get_commit_history',
    description: 'Retrieve commit history for a branch.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: {
          type: 'string',
          description: 'Branch name. Defaults to "main".',
        },
        path: { type: 'string', description: 'Filter by file path.' },
        perPage: {
          type: 'number',
          description: 'Number of commits (max 100). Defaults to 10.',
        },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== USER TOOLS ==============
  {
    name: 'github_get_user_info',
    description: 'Get profile information about the authenticated GitHub user.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    riskLevel: 'auto',
    category: 'github',
  },
];

// ─── Tool Executors ───────────────────────────────────────────

export function registerGitHubExecutors(service: AgentService): void {
  // ============== REPOSITORY EXECUTORS ==============

  service.registerToolExecutor('github_create_repo', async (args) => {
    try {
      const result = await githubFetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: args.name as string,
          description: (args.description as string) || '',
          private: (args.isPrivate as boolean) ?? false,
          auto_init: (args.autoInit as boolean) ?? true,
          gitignore_template: (args.gitignoreTemplate as string) || undefined,
        }),
      });
      await sendNotification(`تم إنشاء مستودع: ${result.full_name}`, 'success');
      return {
        success: true,
        data: {
          name: result.name,
          fullName: result.full_name,
          url: result.html_url,
          cloneUrl: result.clone_url,
          isPrivate: result.private,
          defaultBranch: result.default_branch,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE REPO — with auto-owner resolution
  // ═══════════════════════════════════════════════════════════════
  service.registerToolExecutor('github_delete_repo', async (args) => {
    let owner = (args.owner as string) || '';
    const repo = args.repo as string;
    const limitation = TOOL_LIMITATIONS.github_delete_repo;

    // ── Step 1: Auto-resolve owner if missing or suspicious ──
    if (
      !owner ||
      owner === 'unknown' ||
      owner === 'undefined' ||
      owner.includes(' ')
    ) {
      const resolvedUsername = await getAuthenticatedUsername();
      if (resolvedUsername) {
        owner = resolvedUsername;
        console.log(`[github_delete_repo] Auto-resolved owner to: ${owner}`);
      } else {
        return {
          success: false,
          error:
            'لم يتم تحديد مالك المستودع (owner) ولم نتمكن من استخراجه من التوكن. يرجى تحديد الـ owner يدوياً.',
        };
      }
    }

    // ── Step 2: Verify the repo exists before attempting delete ──
    try {
      await githubFetch(`/repos/${owner}/${repo}`);
    } catch (checkError) {
      if (checkError instanceof GitHubApiError && checkError.isNotFound()) {
        // Maybe wrong owner — try with authenticated user
        const authUsername = await getAuthenticatedUsername();
        if (authUsername && authUsername !== owner) {
          try {
            await githubFetch(`/repos/${authUsername}/${repo}`);
            // Found under authenticated user!
            owner = authUsername;
            console.log(`[github_delete_repo] Corrected owner to: ${owner}`);
          } catch {
            return {
              success: false,
              error:
                `المستودع ${repo} غير موجود تحت ${owner} ولا تحت ${authUsername}.\n` +
                `تأكد من اسم المستودع.`,
            };
          }
        } else {
          return {
            success: false,
            error: `المستودع ${owner}/${repo} غير موجود.`,
          };
        }
      }
      // Other errors (network, etc.) — continue and let the delete call handle it
    }

    // ── Step 3: Attempt deletion ──
    try {
      await githubFetch(`/repos/${owner}/${repo}`, { method: 'DELETE' });
      await sendNotification(
        `⚠️ تم حذف المستودع: ${owner}/${repo} نهائياً`,
        'success'
      );
      return {
        success: true,
        data: {
          deleted: `${owner}/${repo}`,
          message: `تم حذف المستودع ${owner}/${repo} نهائياً بنجاح.`,
        },
      };
    } catch (error) {
      if (error instanceof GitHubApiError) {
        if (error.isPermissionError()) {
          await sendNotification(
            `⚠️ لا يمكن حذف ${owner}/${repo} — صلاحية delete_repo مطلوبة`,
            'error'
          );
          return {
            success: false,
            error:
              `${limitation.userMessage}\n\n` +
              `${limitation.fallbackInstructions}\n\n` +
              `الخطأ الأصلي: ${error.message}`,
          };
        }

        if (error.isNotFound()) {
          return {
            success: false,
            error: `المستودع ${owner}/${repo} غير موجود أو التوكن لا يملك صلاحية رؤيته.`,
          };
        }
      }

      return {
        success: false,
        error:
          `فشل حذف المستودع ${owner}/${repo}.\n\n` +
          `${limitation.fallbackInstructions}\n\n` +
          `الخطأ: ${(error as Error).message}`,
      };
    }
  });

  service.registerToolExecutor('github_list_repos', async (args) => {
    try {
      const sort = (args.sort as string) || 'updated';
      const perPage = (args.perPage as number) || 10;
      const result = await githubFetch(
        `/user/repos?sort=${sort}&per_page=${perPage}&direction=desc`
      );
      const repos = (result as unknown as Array<Record<string, unknown>>).map(
        (r) => ({
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          description: r.description || '',
          isPrivate: r.private,
          language: r.language,
          stars: r.stargazers_count,
          updatedAt: r.updated_at,
        })
      );
      return { success: true, data: { count: repos.length, repos } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_get_repo_info', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}`);
      return {
        success: true,
        data: {
          name: result.name,
          fullName: result.full_name,
          description: result.description,
          url: result.html_url,
          cloneUrl: result.clone_url,
          defaultBranch: result.default_branch,
          isPrivate: result.private,
          language: result.language,
          stars: result.stargazers_count,
          forks: result.forks_count,
          openIssues: result.open_issues_count,
          size: result.size,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_search_repos', async (args) => {
    try {
      const query = encodeURIComponent(args.query as string);
      const sort = (args.sort as string) || 'stars';
      const perPage = (args.perPage as number) || 5;
      const result = await githubFetch(
        `/search/repositories?q=${query}&sort=${sort}&per_page=${perPage}`
      );
      const items = (
        (result.items || []) as Array<Record<string, unknown>>
      ).map((r) => ({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description || '',
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.updated_at,
      }));
      return {
        success: true,
        data: { totalCount: result.total_count, repos: items },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== FILE EXECUTORS ==============

  service.registerToolExecutor('github_push_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const content = args.content as string;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      let sha: string | undefined;
      try {
        const existing = await githubFetch(
          `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        );
        sha = existing.sha as string;
      } catch {
        /* file doesn't exist */
      }

      const base64Content = btoa(unescape(encodeURIComponent(content)));
      const result = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: base64Content,
            branch,
            ...(sha ? { sha } : {}),
          }),
        }
      );
      const commitData = result.commit as Record<string, unknown> | undefined;
      await sendNotification(
        `تم ${sha ? 'تحديث' : 'إنشاء'}: ${path} في ${owner}/${repo}`,
        'success'
      );
      return {
        success: true,
        data: {
          path,
          action: sha ? 'updated' : 'created',
          commitSha: commitData?.sha || '',
          commitUrl: commitData?.html_url || '',
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_push_files', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const files = args.files as Array<{ path: string; content: string }>;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/ref/heads/${branch}`
      );
      const latestCommitSha = (refData.object as Record<string, unknown>)
        .sha as string;
      const commitData = await githubFetch(
        `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
      );
      const baseTreeSha = (commitData.tree as Record<string, unknown>)
        .sha as string;

      const tree = [];
      for (const file of files) {
        const blob = await githubFetch(`/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
        });
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      }

      const newTree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree }),
      });
      const newCommit = await githubFetch(
        `/repos/${owner}/${repo}/git/commits`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            tree: newTree.sha,
            parents: [latestCommitSha],
          }),
        }
      );
      await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha }),
      });

      await sendNotification(
        `تم دفع ${files.length} ملف(ات) إلى ${owner}/${repo}`,
        'success'
      );
      return {
        success: true,
        data: {
          filesCount: files.length,
          commitSha: newCommit.sha,
          commitUrl: newCommit.html_url,
          branch,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_read_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const branch = (args.branch as string) || 'main';
      const content = await githubFetchRaw(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );
      return {
        success: true,
        data: {
          path,
          content:
            content.length > 50000
              ? content.slice(0, 50000) + '\n\n... [تم اقتطاع المحتوى]'
              : content,
          size: content.length,
          truncated: content.length > 50000,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_edit_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const oldStr = args.old_str as string;
      const newStr = args.new_str as string;
      const branch = (args.branch as string) || 'main';
      const message = args.message as string;

      const fileData = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );
      const sha = fileData.sha as string;
      const currentContentB64 = fileData.content as string;
      const currentContent = decodeURIComponent(
        escape(atob(currentContentB64.replace(/\n/g, '')))
      );

      if (!currentContent.includes(oldStr)) {
        return {
          success: false,
          error: `النص المطلوب استبداله غير موجود في الملف ${path}.`,
        };
      }

      const matchCount = currentContent.split(oldStr).length - 1;
      if (matchCount > 1) {
        return {
          success: false,
          error: `تم العثور على ${matchCount} تطابقات في ${path}. يرجى تقديم نص أكثر تحديداً.`,
        };
      }

      const newContent = currentContent.replace(oldStr, newStr);
      const base64Content = btoa(unescape(encodeURIComponent(newContent)));

      const result = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: base64Content,
            branch,
            sha,
          }),
        }
      );

      const commitData = result.commit as Record<string, unknown> | undefined;
      const linesChanged =
        newStr.split('\n').length - oldStr.split('\n').length;

      await sendNotification(
        `تم تعديل ${path} — ${Math.abs(linesChanged)} سطر ${linesChanged >= 0 ? 'أُضيف' : 'أُزيل'}`,
        'success'
      );
      return {
        success: true,
        data: {
          path,
          action: 'edited',
          linesAdded: newStr.split('\n').length,
          linesRemoved: oldStr.split('\n').length,
          netChange: linesChanged,
          commitSha: commitData?.sha || '',
          commitUrl: commitData?.html_url || '',
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_delete_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      const existing = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );
      const sha = existing.sha as string;
      if (!sha) return { success: false, error: `الملف ${path} غير موجود.` };

      const result = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ message, sha, branch }),
        }
      );
      await sendNotification(
        `تم حذف الملف: ${path} من ${owner}/${repo}`,
        'success'
      );
      return {
        success: true,
        data: {
          deleted: path,
          commitSha: (result.commit as Record<string, unknown>)?.sha || '',
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_list_files', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = (args.path as string) || '';
      const branch = (args.branch as string) || 'main';

      const result = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );
      const items = (result as unknown as Array<Record<string, unknown>>).map(
        (item) => ({
          name: item.name,
          type: item.type,
          size: item.size || 0,
          path: item.path,
          downloadUrl: item.download_url || null,
        })
      );
      return {
        success: true,
        data: { path: path || '/', count: items.length, items },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== BRANCH EXECUTORS ==============

  service.registerToolExecutor('github_create_branch', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = args.branch as string;
      const fromBranch = (args.fromBranch as string) || 'main';

      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`
      );
      const sha = (refData.object as Record<string, unknown>).sha as string;
      await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
      });
      await sendNotification(
        `تم إنشاء فرع: ${branch} من ${fromBranch}`,
        'success'
      );
      return { success: true, data: { branch, fromBranch, sha } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_list_branches', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(
        `/repos/${owner}/${repo}/branches?per_page=30`
      );
      const branches = (
        result as unknown as Array<Record<string, unknown>>
      ).map((b) => ({
        name: b.name,
        protected: b.protected,
        commitSha: (
          ((b.commit as Record<string, unknown>)?.sha as string) || ''
        ).slice(0, 7),
      }));
      return { success: true, data: { count: branches.length, branches } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_delete_branch', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = args.branch as string;

      const repoInfo = await githubFetch(`/repos/${owner}/${repo}`);
      if (repoInfo.default_branch === branch) {
        return {
          success: false,
          error: `لا يمكن حذف الفرع الافتراضي "${branch}".`,
        };
      }

      await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'DELETE',
      });
      await sendNotification(
        `⚠️ تم حذف الفرع: ${branch} من ${owner}/${repo}`,
        'success'
      );
      return {
        success: true,
        data: { deleted: branch, repo: `${owner}/${repo}` },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== PULL REQUEST EXECUTORS ==============

  service.registerToolExecutor('github_create_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({
          title: args.title as string,
          body: (args.body as string) || '',
          head: args.head as string,
          base: args.base as string,
          draft: (args.draft as boolean) ?? false,
        }),
      });
      await sendNotification(
        `تم إنشاء PR #${result.number}: ${result.title}`,
        'success'
      );
      return {
        success: true,
        data: {
          number: result.number,
          url: result.html_url,
          title: result.title,
          state: result.state,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_list_pull_requests', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const state = (args.state as string) || 'open';
      const result = await githubFetch(
        `/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`
      );
      const prs = (result as unknown as Array<Record<string, unknown>>).map(
        (pr) => ({
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: pr.state,
          author: (pr.user as Record<string, unknown>)?.login || '',
          createdAt: pr.created_at,
        })
      );
      return { success: true, data: { count: prs.length, pullRequests: prs } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_get_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const pullNumber = args.pullNumber as number;
      const pr = await githubFetch(
        `/repos/${owner}/${repo}/pulls/${pullNumber}`
      );
      const user = (pr.user as Record<string, unknown>) || {};
      const head = (pr.head as Record<string, unknown>) || {};
      const base = (pr.base as Record<string, unknown>) || {};
      return {
        success: true,
        data: {
          number: pr.number,
          title: pr.title,
          body: pr.body || '',
          state: pr.state,
          url: pr.html_url,
          author: user.login || '',
          headBranch: head.ref || '',
          baseBranch: base.ref || '',
          isDraft: pr.draft || false,
          mergeable: pr.mergeable,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          commits: pr.commits,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_merge_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const pullNumber = args.pullNumber as number;
      const mergeMethod = (args.mergeMethod as string) || 'merge';
      const result = await githubFetch(
        `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
        {
          method: 'PUT',
          body: JSON.stringify({
            merge_method: mergeMethod,
            commit_title: (args.commitTitle as string) || undefined,
            commit_message: (args.commitMessage as string) || undefined,
          }),
        }
      );
      await sendNotification(`تم دمج PR #${pullNumber} بنجاح`, 'success');
      return {
        success: true,
        data: {
          merged: true,
          sha: result.sha,
          message: result.message,
          pullNumber,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== ISSUE EXECUTORS ==============

  service.registerToolExecutor('github_create_issue', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: args.title as string,
          body: (args.body as string) || '',
          labels: (args.labels as string[]) || [],
        }),
      });
      await sendNotification(
        `تم إنشاء Issue #${result.number}: ${result.title}`,
        'success'
      );
      return {
        success: true,
        data: {
          number: result.number,
          url: result.html_url,
          title: result.title,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_list_issues', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const state = (args.state as string) || 'open';
      const sort = (args.sort as string) || 'created';
      const perPage = (args.perPage as number) || 10;
      const labels = (args.labels as string) || '';

      let url = `/repos/${owner}/${repo}/issues?state=${state}&sort=${sort}&per_page=${perPage}&direction=desc`;
      if (labels) url += `&labels=${encodeURIComponent(labels)}`;

      const result = await githubFetch(url);
      const issues = (result as unknown as Array<Record<string, unknown>>)
        .filter((i) => !i.pull_request)
        .map((i) => ({
          number: i.number,
          title: i.title,
          url: i.html_url,
          state: i.state,
          labels: ((i.labels || []) as Array<Record<string, unknown>>).map(
            (l) => l.name
          ),
          author: (i.user as Record<string, unknown>)?.login || '',
          comments: i.comments,
          createdAt: i.created_at,
        }));
      return { success: true, data: { count: issues.length, issues } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_update_issue', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const issueNumber = args.issueNumber as number;

      const updatePayload: Record<string, unknown> = {};
      if (args.title !== undefined) updatePayload.title = args.title;
      if (args.body !== undefined) updatePayload.body = args.body;
      if (args.state !== undefined) updatePayload.state = args.state;
      if (args.labels !== undefined) updatePayload.labels = args.labels;
      if (args.assignees !== undefined)
        updatePayload.assignees = args.assignees;

      if (Object.keys(updatePayload).length === 0) {
        return { success: false, error: 'لم يتم تقديم أي حقول للتحديث.' };
      }

      const result = await githubFetch(
        `/repos/${owner}/${repo}/issues/${issueNumber}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        }
      );

      const updatedFields = Object.keys(updatePayload).join(', ');
      await sendNotification(
        `تم تحديث Issue #${issueNumber} (${updatedFields})`,
        'success'
      );
      return {
        success: true,
        data: {
          number: result.number,
          title: result.title,
          state: result.state,
          url: result.html_url,
          updatedFields,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  service.registerToolExecutor('github_add_comment', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const issueNumber = args.issueNumber as number;
      const body = args.body as string;

      const result = await githubFetch(
        `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ body }),
        }
      );

      await sendNotification(`تم إضافة تعليق على #${issueNumber}`, 'success');
      return {
        success: true,
        data: { id: result.id, url: result.html_url, issueNumber },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== SEARCH EXECUTORS ==============

  service.registerToolExecutor('github_search_code', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const query = args.query as string;
      const fileExtension = args.fileExtension as string | undefined;
      const path = args.path as string | undefined;
      const perPage = (args.perPage as number) || 10;

      let searchQuery = `${query}+repo:${owner}/${repo}`;
      if (fileExtension) searchQuery += `+extension:${fileExtension}`;
      if (path) searchQuery += `+path:${path}`;

      const result = await githubFetch(
        `/search/code?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}`,
        { headers: { Accept: 'application/vnd.github.text-match+json' } }
      );

      const items = (
        (result.items || []) as Array<Record<string, unknown>>
      ).map((item) => {
        const textMatches =
          (item.text_matches as Array<Record<string, unknown>>) || [];
        return {
          name: item.name,
          path: item.path,
          url: item.html_url,
          matches: textMatches.map((m) => ({
            fragment: m.fragment,
            property: m.property,
          })),
        };
      });

      return {
        success: true,
        data: {
          totalCount: result.total_count,
          resultCount: items.length,
          query,
          items,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== HISTORY EXECUTORS ==============

  service.registerToolExecutor('github_get_commit_history', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = (args.branch as string) || 'main';
      const path = args.path as string | undefined;
      const perPage = (args.perPage as number) || 10;

      let url = `/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`;
      if (path) url += `&path=${encodeURIComponent(path)}`;

      const result = await githubFetch(url);
      const commits = (result as unknown as Array<Record<string, unknown>>).map(
        (c) => {
          const commit = (c.commit as Record<string, unknown>) || {};
          const author = (commit.author as Record<string, unknown>) || {};
          const committer = (commit.committer as Record<string, unknown>) || {};
          return {
            sha: ((c.sha as string) || '').slice(0, 7),
            fullSha: c.sha,
            message: commit.message,
            author:
              author.name || (c.author as Record<string, unknown>)?.login || '',
            authorEmail: author.email,
            date: author.date || committer.date,
            url: c.html_url,
          };
        }
      );

      return {
        success: true,
        data: { branch, count: commits.length, commits },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============== USER EXECUTORS ==============

  service.registerToolExecutor('github_get_user_info', async () => {
    try {
      const result = await githubFetch('/user');
      return {
        success: true,
        data: {
          login: result.login,
          name: result.name,
          bio: result.bio,
          avatarUrl: result.avatar_url,
          profileUrl: result.html_url,
          publicRepos: result.public_repos,
          followers: result.followers,
          following: result.following,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
