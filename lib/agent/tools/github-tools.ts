/**
 * CodeForge IDE — GitHub API Tools
 * Agent tools for direct GitHub repository operations.
 * Uses GitHub REST API with Personal Access Token.
 *
 * 19 tools: create_repo, delete_repo, list_repos, push_file, push_files,
 *           read_file, delete_file, list_files, create_branch, list_branches,
 *           create_pull_request, list_pull_requests, merge_pull_request,
 *           create_issue, list_issues, add_comment, get_repo_info,
 *           get_user_info, search_repos.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import { sendNotification } from '../bridge';

const GITHUB_API = 'https://api.github.com';

// ─── Helper: Get GitHub Token ─────────────────────────────────

async function getGitHubToken(): Promise<string> {
  try {
    const configRaw = localStorage.getItem('codeforge-agent-config');
    if (configRaw) {
      const config = JSON.parse(configRaw);
      if (config.githubToken) return config.githubToken;
    }
  } catch { /* ignore */ }

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

  if (response.status === 204) return { success: true };

  return response.json();
}

// Helper for raw text responses (file content)
async function githubFetchRaw(
  endpoint: string
): Promise<string> {
  const token = await getGitHubToken();

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error (${response.status}): ${response.statusText}`);
  }

  return response.text();
}

// ─── Tool Definitions ─────────────────────────────────────────

export const githubTools: ToolDefinition[] = [
  // ============== REPOSITORY TOOLS ==============
  {
    name: 'github_create_repo',
    description: 'Create a new GitHub repository. Can create public or private repos with optional initialization (README, .gitignore, license).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name (e.g., "my-project").' },
        description: { type: 'string', description: 'Short description of the repository.' },
        isPrivate: { type: 'boolean', description: 'Whether the repo should be private. Defaults to false (public).' },
        autoInit: { type: 'boolean', description: 'Initialize with a README. Defaults to true.' },
        gitignoreTemplate: { type: 'string', description: 'Gitignore template (e.g., "Node", "Python"). Optional.' },
      },
      required: ['name'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_delete_repo',
    description: 'Delete a GitHub repository permanently. This action is IRREVERSIBLE and will delete all code, issues, PRs, and settings. Requires user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username or org).' },
        repo: { type: 'string', description: 'Repository name to delete.' },
      },
      required: ['owner', 'repo'],
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
        sort: { type: 'string', description: 'Sort by: "created", "updated", "pushed", "full_name".', enum: ['created', 'updated', 'pushed', 'full_name'] },
        perPage: { type: 'number', description: 'Number of repos to return (max 100). Defaults to 10.' },
      },
      required: [],
    },
    riskLevel: 'auto',
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
  {
    name: 'github_search_repos',
    description: 'Search for GitHub repositories by keyword, language, topic, or other criteria. Returns matching repos with stats.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "react language:typescript stars:>100").' },
        sort: { type: 'string', description: 'Sort by: "stars", "forks", "updated", "help-wanted-issues".', enum: ['stars', 'forks', 'updated', 'help-wanted-issues'] },
        perPage: { type: 'number', description: 'Number of results (max 30). Defaults to 5.' },
      },
      required: ['query'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== FILE TOOLS ==============
  {
    name: 'github_push_file',
    description: 'Create or update a single file in a GitHub repository. If the file exists, it will be updated; otherwise created.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username or org).' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path in the repo (e.g., "src/index.ts").' },
        content: { type: 'string', description: 'File content (plain text, will be base64 encoded automatically).' },
        message: { type: 'string', description: 'Commit message.' },
        branch: { type: 'string', description: 'Branch to push to. Defaults to "main".' },
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
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
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
        message: { type: 'string', description: 'Commit message.' },
        branch: { type: 'string', description: 'Branch to push to. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'files', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_read_file',
    description: 'Read the content of a file from a GitHub repository. Returns the raw file content as text.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path in the repo (e.g., "src/index.ts").' },
        branch: { type: 'string', description: 'Branch to read from. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'path'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_delete_file',
    description: 'Delete a file from a GitHub repository. Requires the file path and a commit message.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path to delete (e.g., "src/old-file.ts").' },
        message: { type: 'string', description: 'Commit message for the deletion.' },
        branch: { type: 'string', description: 'Branch to delete from. Defaults to "main".' },
      },
      required: ['owner', 'repo', 'path', 'message'],
    },
    riskLevel: 'confirm',
    category: 'github',
  },
  {
    name: 'github_list_files',
    description: 'List files and directories in a path of a GitHub repository. Returns names, types, sizes, and download URLs.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'Directory path (empty string "" for root). Defaults to root.' },
        branch: { type: 'string', description: 'Branch to list from. Defaults to "main".' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== BRANCH TOOLS ==============
  {
    name: 'github_create_branch',
    description: 'Create a new branch in a GitHub repository from an existing branch.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: { type: 'string', description: 'Name of the new branch.' },
        fromBranch: { type: 'string', description: 'Source branch. Defaults to "main".' },
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
        state: { type: 'string', description: 'Filter by state: "open", "closed", "all".', enum: ['open', 'closed', 'all'] },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_merge_pull_request',
    description: 'Merge a pull request in a GitHub repository. Supports merge, squash, and rebase strategies.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        pullNumber: { type: 'number', description: 'Pull request number to merge.' },
        mergeMethod: { type: 'string', description: 'Merge method: "merge", "squash", or "rebase". Defaults to "merge".', enum: ['merge', 'squash', 'rebase'] },
        commitTitle: { type: 'string', description: 'Custom merge commit title. Optional.' },
        commitMessage: { type: 'string', description: 'Custom merge commit message. Optional.' },
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
        body: { type: 'string', description: 'Issue description (Markdown supported).' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Labels to add (e.g., ["bug", "enhancement"]).' },
      },
      required: ['owner', 'repo', 'title'],
    },
    riskLevel: 'notify',
    category: 'github',
  },
  {
    name: 'github_list_issues',
    description: 'List issues in a GitHub repository. Can filter by state, labels, and sort order.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        state: { type: 'string', description: 'Filter by state: "open", "closed", "all". Defaults to "open".', enum: ['open', 'closed', 'all'] },
        labels: { type: 'string', description: 'Comma-separated list of labels to filter by.' },
        sort: { type: 'string', description: 'Sort by: "created", "updated", "comments".', enum: ['created', 'updated', 'comments'] },
        perPage: { type: 'number', description: 'Number of issues to return. Defaults to 10.' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
    category: 'github',
  },
  {
    name: 'github_add_comment',
    description: 'Add a comment to an issue or pull request in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        issueNumber: { type: 'number', description: 'Issue or PR number to comment on.' },
        body: { type: 'string', description: 'Comment text (Markdown supported).' },
      },
      required: ['owner', 'repo', 'issueNumber', 'body'],
    },
    riskLevel: 'notify',
    category: 'github',
  },

  // ============== USER TOOLS ==============
  {
    name: 'github_get_user_info',
    description: 'Get profile information about the authenticated GitHub user. Returns username, bio, public repos count, followers, etc.',
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
      await sendNotification(`🤖 تم إنشاء مستودع: ${result.full_name}`, 'success');
      return {
        success: true,
        data: {
          name: result.name, fullName: result.full_name, url: result.html_url,
          cloneUrl: result.clone_url, isPrivate: result.private, defaultBranch: result.default_branch,
        },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_delete_repo', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      await githubFetch(`/repos/${owner}/${repo}`, { method: 'DELETE' });
      await sendNotification(`🤖 ⚠️ تم حذف المستودع: ${owner}/${repo} نهائياً`, 'success');
      return { success: true, data: { deleted: `${owner}/${repo}`, message: `Repository ${owner}/${repo} has been permanently deleted.` } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_list_repos', async (args) => {
    try {
      const sort = (args.sort as string) || 'updated';
      const perPage = (args.perPage as number) || 10;
      const result = await githubFetch(`/user/repos?sort=${sort}&per_page=${perPage}&direction=desc`);
      const repos = (result as unknown as Array<Record<string, unknown>>).map((r) => ({
        name: r.name, fullName: r.full_name, url: r.html_url,
        description: r.description || '', isPrivate: r.private,
        language: r.language, stars: r.stargazers_count, updatedAt: r.updated_at,
      }));
      return { success: true, data: { count: repos.length, repos } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_get_repo_info', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}`);
      return {
        success: true,
        data: {
          name: result.name, fullName: result.full_name, description: result.description,
          url: result.html_url, cloneUrl: result.clone_url, defaultBranch: result.default_branch,
          isPrivate: result.private, language: result.language, stars: result.stargazers_count,
          forks: result.forks_count, openIssues: result.open_issues_count,
          size: result.size, createdAt: result.created_at, updatedAt: result.updated_at,
        },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_search_repos', async (args) => {
    try {
      const query = encodeURIComponent(args.query as string);
      const sort = (args.sort as string) || 'stars';
      const perPage = (args.perPage as number) || 5;
      const result = await githubFetch(`/search/repositories?q=${query}&sort=${sort}&per_page=${perPage}`);
      const items = ((result.items || []) as Array<Record<string, unknown>>).map((r) => ({
        name: r.name, fullName: r.full_name, url: r.html_url,
        description: r.description || '', language: r.language,
        stars: r.stargazers_count, forks: r.forks_count, updatedAt: r.updated_at,
      }));
      return { success: true, data: { totalCount: result.total_count, repos: items } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
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
        const existing = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
        sha = existing.sha as string;
      } catch { /* file doesn't exist */ }

      const base64Content = btoa(unescape(encodeURIComponent(content)));
      const result = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({ message, content: base64Content, branch, ...(sha ? { sha } : {}) }),
      });
      const commitData = result.commit as Record<string, unknown> | undefined;
      await sendNotification(`🤖 تم ${sha ? 'تحديث' : 'إنشاء'}: ${path} في ${owner}/${repo}`, 'success');
      return {
        success: true,
        data: { path, action: sha ? 'updated' : 'created', commitSha: commitData?.sha || '', commitUrl: commitData?.html_url || '' },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_push_files', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const files = args.files as Array<{ path: string; content: string }>;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
      const latestCommitSha = (refData.object as Record<string, unknown>).sha as string;
      const commitData = await githubFetch(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
      const baseTreeSha = (commitData.tree as Record<string, unknown>).sha as string;

      const tree = [];
      for (const file of files) {
        const blob = await githubFetch(`/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST', body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
        });
        tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
      }

      const newTree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, {
        method: 'POST', body: JSON.stringify({ base_tree: baseTreeSha, tree }),
      });
      const newCommit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, {
        method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [latestCommitSha] }),
      });
      await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }),
      });

      await sendNotification(`🤖 تم دفع ${files.length} ملف(ات) إلى ${owner}/${repo}`, 'success');
      return { success: true, data: { filesCount: files.length, commitSha: newCommit.sha, commitUrl: newCommit.html_url, branch } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_read_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const branch = (args.branch as string) || 'main';

      const content = await githubFetchRaw(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);

      return {
        success: true,
        data: {
          path,
          content: content.length > 50000 ? content.slice(0, 50000) + '\n\n... [تم اقتطاع المحتوى - الملف كبير جداً]' : content,
          size: content.length,
          truncated: content.length > 50000,
        },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_delete_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const message = args.message as string;
      const branch = (args.branch as string) || 'main';

      const existing = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      const sha = existing.sha as string;
      if (!sha) return { success: false, error: `الملف ${path} غير موجود في المستودع.` };

      const result = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'DELETE', body: JSON.stringify({ message, sha, branch }),
      });
      await sendNotification(`🤖 تم حذف الملف: ${path} من ${owner}/${repo}`, 'success');
      return { success: true, data: { deleted: path, commitSha: (result.commit as Record<string, unknown>)?.sha || '' } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_list_files', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = (args.path as string) || '';
      const branch = (args.branch as string) || 'main';

      const result = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      const items = (result as unknown as Array<Record<string, unknown>>).map((item) => ({
        name: item.name,
        type: item.type, // "file" or "dir"
        size: item.size || 0,
        path: item.path,
        downloadUrl: item.download_url || null,
      }));

      return { success: true, data: { path: path || '/', count: items.length, items } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  // ============== BRANCH EXECUTORS ==============

  service.registerToolExecutor('github_create_branch', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = args.branch as string;
      const fromBranch = (args.fromBranch as string) || 'main';

      const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
      const sha = (refData.object as Record<string, unknown>).sha as string;
      await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
      });
      await sendNotification(`🤖 تم إنشاء فرع: ${branch} من ${fromBranch}`, 'success');
      return { success: true, data: { branch, fromBranch, sha } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_list_branches', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}/branches?per_page=30`);
      const branches = (result as unknown as Array<Record<string, unknown>>).map((b) => ({
        name: b.name, protected: b.protected,
        commitSha: ((b.commit as Record<string, unknown>)?.sha as string || '').slice(0, 7),
      }));
      return { success: true, data: { count: branches.length, branches } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  // ============== PULL REQUEST EXECUTORS ==============

  service.registerToolExecutor('github_create_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({
          title: args.title as string, body: (args.body as string) || '',
          head: args.head as string, base: args.base as string,
        }),
      });
      await sendNotification(`🤖 تم إنشاء PR #${result.number}: ${result.title}`, 'success');
      return { success: true, data: { number: result.number, url: result.html_url, title: result.title, state: result.state } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_list_pull_requests', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const state = (args.state as string) || 'open';
      const result = await githubFetch(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`);
      const prs = (result as unknown as Array<Record<string, unknown>>).map((pr) => ({
        number: pr.number, title: pr.title, url: pr.html_url, state: pr.state,
        author: (pr.user as Record<string, unknown>)?.login || '', createdAt: pr.created_at,
      }));
      return { success: true, data: { count: prs.length, pullRequests: prs } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_merge_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const pullNumber = args.pullNumber as number;
      const mergeMethod = (args.mergeMethod as string) || 'merge';

      const result = await githubFetch(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
        method: 'PUT',
        body: JSON.stringify({
          merge_method: mergeMethod,
          commit_title: (args.commitTitle as string) || undefined,
          commit_message: (args.commitMessage as string) || undefined,
        }),
      });

      await sendNotification(`🤖 تم دمج PR #${pullNumber} بنجاح (طريقة: ${mergeMethod})`, 'success');
      return {
        success: true,
        data: { merged: true, sha: result.sha, message: result.message, pullNumber },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  // ============== ISSUE EXECUTORS ==============

  service.registerToolExecutor('github_create_issue', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const result = await githubFetch(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: args.title as string, body: (args.body as string) || '',
          labels: (args.labels as string[]) || [],
        }),
      });
      await sendNotification(`🤖 تم إنشاء Issue #${result.number}: ${result.title}`, 'success');
      return { success: true, data: { number: result.number, url: result.html_url, title: result.title } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
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
        .filter((i) => !i.pull_request) // Exclude PRs from issues list
        .map((i) => ({
          number: i.number, title: i.title, url: i.html_url,
          state: i.state, labels: ((i.labels || []) as Array<Record<string, unknown>>).map((l) => l.name),
          author: (i.user as Record<string, unknown>)?.login || '',
          comments: i.comments, createdAt: i.created_at,
        }));

      return { success: true, data: { count: issues.length, issues } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  service.registerToolExecutor('github_add_comment', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const issueNumber = args.issueNumber as number;
      const body = args.body as string;

      const result = await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });

      await sendNotification(`🤖 تم إضافة تعليق على #${issueNumber}`, 'success');
      return { success: true, data: { id: result.id, url: result.html_url, issueNumber } };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  // ============== USER EXECUTORS ==============

  service.registerToolExecutor('github_get_user_info', async () => {
    try {
      const result = await githubFetch('/user');
      return {
        success: true,
        data: {
          login: result.login, name: result.name, bio: result.bio,
          avatarUrl: result.avatar_url, profileUrl: result.html_url,
          publicRepos: result.public_repos, followers: result.followers,
          following: result.following, createdAt: result.created_at,
        },
      };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });
}
