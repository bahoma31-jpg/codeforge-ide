/**
 * CodeForge IDE — GitHub API Tools
 * Agent tools for direct GitHub repository operations.
 * Uses GitHub REST API with Personal Access Token.
 *
 * 10 tools: create_repo, list_repos, push_file, push_files,
 *           create_branch, list_branches, create_pull_request,
 *           list_pull_requests, create_issue, get_repo_info.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import { sendNotification } from '../bridge';

const GITHUB_API = 'https://api.github.com';

// ─── Helper: Get GitHub Token ─────────────────────────────────

async function getGitHubToken(): Promise<string> {
  // Try agent config first
  try {
    const configRaw = localStorage.getItem('codeforge-agent-config');
    if (configRaw) {
      const config = JSON.parse(configRaw);
      if (config.githubToken) return config.githubToken;
    }
  } catch { /* ignore */ }

  // Fallback: try auth-store (existing GitHub OAuth token)
  try {
    const { useAuthStore } = await import('@/lib/stores/auth-store');
    const token = useAuthStore.getState().token;
    if (token) return token;
  } catch { /* ignore */ }

  throw new Error('لم يتم العثور على GitHub Token. يرجى إدخاله في إعدادات الوكيل.');
}

// ─── Helper: GitHub API Call ──────────────────────────────────

async function githubFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const token = await getGitHubToken();

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error as { message?: string }).message || `HTTP ${response.status}`;
    throw new Error(`GitHub API Error (${response.status}): ${message}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return { success: true };

  return response.json();
}

// ─── Tool Definitions ─────────────────────────────────────────

export const githubTools: ToolDefinition[] = [
  {
    name: 'github_create_repo',
    description: 'Create a new GitHub repository. Can create public or private repos with optional initialization (README, .gitignore, license).',
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
          description: 'Whether the repo should be private. Defaults to false (public).',
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
    name: 'github_list_repos',
    description: 'List GitHub repositories for the authenticated user. Returns repo names, URLs, and basic info.',
    parameters: {
      type: 'object',
      properties: {
        sort: {
          type: 'string',
          description: 'Sort by: "created", "updated", "pushed", "full_name". Defaults to "updated".',
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
    name: 'github_push_file',
    description: 'Create or update a single file in a GitHub repository. If the file exists, it will be updated; otherwise, it will be created.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or org).',
        },
        repo: {
          type: 'string',
          description: 'Repository name.',
        },
        path: {
          type: 'string',
          description: 'File path in the repo (e.g., "src/index.ts").',
        },
        content: {
          type: 'string',
          description: 'File content (plain text, will be base64 encoded automatically).',
        },
        message: {
          type: 'string',
          description: 'Commit message.',
        },
        branch: {
          type: 'string',
          description: 'Branch to push to. Defaults to "main".',
        },
      },
      required: ['owner', 'repo', 'path', 'content', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_push_files',
    description: 'Push multiple files to a GitHub repository in a single commit. Uses the Git Trees API for atomic multi-file commits.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner.',
        },
        repo: {
          type: 'string',
          description: 'Repository name.',
        },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path in the repo.' },
              content: { type: 'string', description: 'File content.' },
            },
            required: ['path', 'content'],
          },
          description: 'Array of files to push.',
        },
        message: {
          type: 'string',
          description: 'Commit message.',
        },
        branch: {
          type: 'string',
          description: 'Branch to push to. Defaults to "main".',
        },
      },
      required: ['owner', 'repo', 'files', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_create_branch',
    description: 'Create a new branch in a GitHub repository from an existing branch.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner.',
        },
        repo: {
          type: 'string',
          description: 'Repository name.',
        },
        branch: {
          type: 'string',
          description: 'Name of the new branch.',
        },
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
        base: { type: 'string', description: 'Target branch (e.g., "main").' },
      },
      required: ['owner', 'repo', 'title', 'head', 'base'],
    },
    riskLevel: 'confirm',
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
          description: 'Filter by state: "open", "closed", "all". Defaults to "open".',
          enum: ['open', 'closed', 'all'],
        },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_create_issue',
    description: 'Create a new issue in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        title: { type: 'string', description: 'Issue title.' },
        body: { type: 'string', description: 'Issue description (Markdown supported).' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add (e.g., ["bug", "enhancement"]).',
        },
      },
      required: ['owner', 'repo', 'title'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_get_repo_info',
    description: 'Get detailed information about a GitHub repository including stats, default branch, and description.',
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
];

// ─── Tool Executors ───────────────────────────────────────────

export function registerGitHubExecutors(service: AgentService): void {

  // ── github_create_repo ──────────────────────────────────
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

      await sendNotification(`🤖 تم إنشاء مستودع: ${result.full_name}`, 'success');

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

  // ── github_list_repos ───────────────────────────────────
  service.registerToolExecutor('github_list_repos', async (args) => {
    try {
      const sort = (args.sort as string) || 'updated';
      const perPage = (args.perPage as number) || 10;

      const result = await githubFetch(
        `/user/repos?sort=${sort}&per_page=${perPage}&direction=desc`
      );

      const repos = (result as unknown as Array<Record<string, unknown>>).map((r) => ({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description || '',
        isPrivate: r.private,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
      }));

      return { success: true, data: { count: repos.length, repos } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── github_push_file ────────────────────────────────────
  service.registerToolExecutor('github_push_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const content = args.content as string;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      // Check if file exists (to get SHA for update)
      let sha: string | undefined;
      try {
        const existing = await githubFetch(
          `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        );
        sha = existing.sha as string;
      } catch { /* file doesn't exist, that's OK */ }

      // Base64 encode content
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
        `🤖 تم ${sha ? 'تحديث' : 'إنشاء'}: ${path} في ${owner}/${repo}`,
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

  // ── github_push_files (multi-file atomic commit) ────────
  service.registerToolExecutor('github_push_files', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const files = args.files as Array<{ path: string; content: string }>;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      // Step 1: Get latest commit SHA on the branch
      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/ref/heads/${branch}`
      );
      const latestCommitSha = (refData.object as Record<string, unknown>).sha as string;

      // Step 2: Get the tree SHA from that commit
      const commitData = await githubFetch(
        `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
      );
      const baseTreeSha = (commitData.tree as Record<string, unknown>).sha as string;

      // Step 3: Create blobs for each file
      const tree = [];
      for (const file of files) {
        const blob = await githubFetch(
          `/repos/${owner}/${repo}/git/blobs`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8',
            }),
          }
        );
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      }

      // Step 4: Create new tree
      const newTree = await githubFetch(
        `/repos/${owner}/${repo}/git/trees`,
        {
          method: 'POST',
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree,
          }),
        }
      );

      // Step 5: Create commit
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

      // Step 6: Update branch reference
      await githubFetch(
        `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ sha: newCommit.sha }),
        }
      );

      await sendNotification(
        `🤖 تم دفع ${files.length} ملف(ات) إلى ${owner}/${repo}`,
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

  // ── github_create_branch ────────────────────────────────
  service.registerToolExecutor('github_create_branch', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = args.branch as string;
      const fromBranch = (args.fromBranch as string) || 'main';

      // Get SHA of source branch
      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`
      );
      const sha = (refData.object as Record<string, unknown>).sha as string;

      // Create new branch
      await githubFetch(
        `/repos/${owner}/${repo}/git/refs`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha,
          }),
        }
      );

      await sendNotification(`🤖 تم إنشاء فرع: ${branch} من ${fromBranch}`, 'success');

      return {
        success: true,
        data: { branch, fromBranch, sha },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── github_list_branches ────────────────────────────────
  service.registerToolExecutor('github_list_branches', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;

      const result = await githubFetch(
        `/repos/${owner}/${repo}/branches?per_page=30`
      );

      const branches = (result as unknown as Array<Record<string, unknown>>).map((b) => ({
        name: b.name,
        protected: b.protected,
        commitSha: ((b.commit as Record<string, unknown>)?.sha as string || '').slice(0, 7),
      }));

      return { success: true, data: { count: branches.length, branches } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── github_create_pull_request ───────────────────────────
  service.registerToolExecutor('github_create_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;

      const result = await githubFetch(
        `/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: args.title as string,
            body: (args.body as string) || '',
            head: args.head as string,
            base: args.base as string,
          }),
        }
      );

      await sendNotification(
        `🤖 تم إنشاء PR #${result.number}: ${result.title}`,
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

  // ── github_list_pull_requests ────────────────────────────
  service.registerToolExecutor('github_list_pull_requests', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const state = (args.state as string) || 'open';

      const result = await githubFetch(
        `/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`
      );

      const prs = (result as unknown as Array<Record<string, unknown>>).map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.state,
        author: (pr.user as Record<string, unknown>)?.login || '',
        createdAt: pr.created_at,
      }));

      return { success: true, data: { count: prs.length, pullRequests: prs } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ── github_create_issue ─────────────────────────────────
  service.registerToolExecutor('github_create_issue', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;

      const result = await githubFetch(
        `/repos/${owner}/${repo}/issues`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: args.title as string,
            body: (args.body as string) || '',
            labels: (args.labels as string[]) || [],
          }),
        }
      );

      await sendNotification(
        `🤖 تم إنشاء Issue #${result.number}: ${result.title}`,
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

  // ── github_get_repo_info ────────────────────────────────
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
}
