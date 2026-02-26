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
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import type { AgentService } from '../agent-service';
import { sendNotification } from '../bridge';

const GITHUB_API = 'https://api.github.com';

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN LIMITATIONS — Operations that require special token scopes
// or are restricted by GitHub API policies.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps tool names to user-friendly messages explaining why they might fail
 * and what the user can do about it. Used by executors to provide clear
 * guidance instead of cryptic API errors.
 */
export const TOOL_LIMITATIONS: Record<string, {
  requiredScope: string;
  userMessage: string;
  fallbackInstructions: string;
}> = {
  github_delete_repo: {
    requiredScope: 'delete_repo',
    userMessage:
      '⚠️ حذف المستودعات يتطلب صلاحية خاصة (delete_repo) في GitHub Token.\n' +
      'هذه الصلاحية غير مفعّلة افتراضياً لأسباب أمنية.',
    fallbackInstructions:
      '**لحذف المستودع يدوياً:**\n' +
      '1. افتح المستودع على GitHub\n' +
      '2. اذهب إلى **Settings** → **Danger Zone**\n' +
      '3. اضغط **Delete this repository**\n\n' +
      '**أو عبر CLI:**\n' +
      '```bash\n' +
      'gh auth refresh -s delete_repo\n' +
      'gh api -X DELETE repos/{owner}/{repo}\n' +
      '```',
  },
};

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
    throw new GitHubApiError(response.status, message, endpoint);
  }

  if (response.status === 204) return { success: true };

  return response.json();
}

/**
 * Custom error class for GitHub API errors.
 * Carries the HTTP status code and endpoint for better error handling.
 */
class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`GitHub API Error (${status}): ${message}`);
    this.name = 'GitHubApiError';
  }

  /** Check if this is a permissions/scope error */
  isPermissionError(): boolean {
    return this.status === 403 || this.status === 401;
  }

  /** Check if the resource was not found */
  isNotFound(): boolean {
    return this.status === 404;
  }
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
    description: 'Delete a GitHub repository permanently. This action is IRREVERSIBLE and will delete all code, issues, PRs, and settings. Requires user confirmation. NOTE: This operation requires the "delete_repo" scope on the GitHub token — if unavailable, the agent will provide manual deletion instructions instead.',
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
    riskLevel: 'notify',  // Fixed: was 'confirm', prompt says NOTIFY for create/update
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
  // ── NEW: github_edit_file ── Surgical edit with old_str/new_str ──
  {
    name: 'github_edit_file',
    description: 'Edit an existing file by replacing a specific text section. Uses surgical old_str/new_str replacement instead of rewriting the entire file. ALWAYS read the file first with github_read_file before using this tool.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        path: { type: 'string', description: 'File path in the repo (e.g., "src/index.ts").' },
        old_str: { type: 'string', description: 'The exact text to find and replace. Must match the file content EXACTLY including whitespace and indentation.' },
        new_str: { type: 'string', description: 'The replacement text that will replace old_str.' },
        branch: { type: 'string', description: 'Branch to edit on. Defaults to "main".' },
        message: { type: 'string', description: 'Commit message describing the change.' },
      },
      required: ['owner', 'repo', 'path', 'old_str', 'new_str', 'message'],
    },
    riskLevel: 'notify',
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
  // ── NEW: github_delete_branch ── Delete a branch ──
  {
    name: 'github_delete_branch',
    description: 'Delete a branch from a GitHub repository. This is irreversible — verify the branch is merged or user acknowledges data loss before proceeding. REQUIRES user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: { type: 'string', description: 'Branch name to delete. Cannot delete the default branch.' },
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
        base: { type: 'string', description: 'Target branch (e.g., "main").' },
        draft: { type: 'boolean', description: 'Create as draft PR. Defaults to false.' },
      },
      required: ['owner', 'repo', 'title', 'head', 'base'],
    },
    riskLevel: 'notify',  // Fixed: was 'confirm', prompt says NOTIFY for PR creation
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
  // ── NEW: github_get_pull_request ── Single PR details ──
  {
    name: 'github_get_pull_request',
    description: 'Get detailed information about a specific pull request including title, body, status, diff stats, review status, and merge info.',
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
  // ── NEW: github_update_issue ── Update existing issue ──
  {
    name: 'github_update_issue',
    description: 'Update an existing issue properties: title, body, state (open/closed), labels, or assignees.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        issueNumber: { type: 'number', description: 'Issue number to update.' },
        title: { type: 'string', description: 'New title. Optional.' },
        body: { type: 'string', description: 'New body/description. Optional.' },
        state: { type: 'string', description: 'New state: "open" or "closed". Optional.', enum: ['open', 'closed'] },
        labels: { type: 'array', items: { type: 'string' }, description: 'Updated labels array. Replaces all existing labels.' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Updated assignees (GitHub usernames).' },
      },
      required: ['owner', 'repo', 'issueNumber'],
    },
    riskLevel: 'notify',
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

  // ============== SEARCH TOOLS ==============
  // ── NEW: github_search_code ── Search code within repository ──
  {
    name: 'github_search_code',
    description: 'Search for code patterns, function names, class definitions, or text across a GitHub repository. Returns matching files with code snippets.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        query: { type: 'string', description: 'Search query — code pattern, function name, variable, or text to find.' },
        fileExtension: { type: 'string', description: 'Filter by file extension (e.g., "ts", "py", "js"). Optional.' },
        path: { type: 'string', description: 'Filter by directory path (e.g., "src/components"). Optional.' },
        perPage: { type: 'number', description: 'Number of results (max 30). Defaults to 10.' },
      },
      required: ['owner', 'repo', 'query'],
    },
    riskLevel: 'auto',
    category: 'github',
  },

  // ============== HISTORY TOOLS ==============
  // ── NEW: github_get_commit_history ── View commit history ──
  {
    name: 'github_get_commit_history',
    description: 'Retrieve commit history for a branch. Shows commit messages, authors, dates, and SHAs. Useful for understanding recent changes and development timeline.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner.' },
        repo: { type: 'string', description: 'Repository name.' },
        branch: { type: 'string', description: 'Branch name. Defaults to "main".' },
        path: { type: 'string', description: 'Filter commits by file path. Optional.' },
        perPage: { type: 'number', description: 'Number of commits to return (max 100). Defaults to 10.' },
      },
      required: ['owner', 'repo'],
    },
    riskLevel: 'auto',
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
    const owner = args.owner as string;
    const repo = args.repo as string;
    const limitation = TOOL_LIMITATIONS.github_delete_repo;

    try {
      await githubFetch(`/repos/${owner}/${repo}`, { method: 'DELETE' });
      await sendNotification(`🤖 ⚠️ تم حذف المستودع: ${owner}/${repo} نهائياً`, 'success');
      return {
        success: true,
        data: {
          deleted: `${owner}/${repo}`,
          message: `Repository ${owner}/${repo} has been permanently deleted.`,
        },
      };
    } catch (error) {
      // ── Enhanced error handling with clear user guidance ──
      if (error instanceof GitHubApiError) {
        // 403 = Token doesn't have delete_repo scope
        if (error.isPermissionError()) {
          await sendNotification(
            `⚠️ لا يمكن حذف ${owner}/${repo} — صلاحية delete_repo غير متوفرة في التوكن`,
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

        // 404 = Repo doesn't exist or token can't see it
        if (error.isNotFound()) {
          return {
            success: false,
            error:
              `المستودع ${owner}/${repo} غير موجود، أو أن التوكن الحالي لا يملك صلاحية رؤيته.\n\n` +
              `تأكد من:\n` +
              `- اسم المستودع مكتوب بشكل صحيح\n` +
              `- التوكن مرتبط بالحساب المالك للمستودع`,
          };
        }
      }

      // Generic fallback
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

  // ── NEW EXECUTOR: github_edit_file ──
  service.registerToolExecutor('github_edit_file', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const oldStr = args.old_str as string;
      const newStr = args.new_str as string;
      const branch = (args.branch as string) || 'main';
      const message = args.message as string;

      // Step 1: Read current file content + SHA
      const fileData = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      const sha = fileData.sha as string;
      const currentContentB64 = fileData.content as string;
      const currentContent = decodeURIComponent(escape(atob(currentContentB64.replace(/\n/g, ''))));

      // Step 2: Verify old_str exists in the file
      if (!currentContent.includes(oldStr)) {
        return {
          success: false,
          error: `النص المطلوب استبداله غير موجود في الملف ${path}. تأكد من مطابقة النص تماماً بما في ذلك المسافات والسطور.`,
        };
      }

      // Step 3: Check for multiple matches (ambiguity)
      const matchCount = currentContent.split(oldStr).length - 1;
      if (matchCount > 1) {
        return {
          success: false,
          error: `تم العثور على ${matchCount} تطابقات للنص المطلوب في ${path}. يرجى تقديم نص أطول وأكثر تحديداً لتجنب الغموض.`,
        };
      }

      // Step 4: Apply the replacement
      const newContent = currentContent.replace(oldStr, newStr);
      const base64Content = btoa(unescape(encodeURIComponent(newContent)));

      // Step 5: Commit the change
      const result = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({ message, content: base64Content, branch, sha }),
      });

      const commitData = result.commit as Record<string, unknown> | undefined;
      const linesChanged = newStr.split('\n').length - oldStr.split('\n').length;

      await sendNotification(`🤖 تم تعديل ${path} — ${Math.abs(linesChanged)} سطر ${linesChanged >= 0 ? 'أُضيف' : 'أُزيل'}`, 'success');
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

  // ── NEW EXECUTOR: github_delete_branch ──
  service.registerToolExecutor('github_delete_branch', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const branch = args.branch as string;

      // Safety check: prevent deleting default branch
      const repoInfo = await githubFetch(`/repos/${owner}/${repo}`);
      if (repoInfo.default_branch === branch) {
        return {
          success: false,
          error: `لا يمكن حذف الفرع الافتراضي "${branch}". يرجى تغيير الفرع الافتراضي أولاً من إعدادات المستودع.`,
        };
      }

      await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'DELETE',
      });

      await sendNotification(`🤖 ⚠️ تم حذف الفرع: ${branch} من ${owner}/${repo}`, 'success');
      return { success: true, data: { deleted: branch, repo: `${owner}/${repo}` } };
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
          draft: (args.draft as boolean) ?? false,
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

  // ── NEW EXECUTOR: github_get_pull_request ──
  service.registerToolExecutor('github_get_pull_request', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const pullNumber = args.pullNumber as number;

      const pr = await githubFetch(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
      const user = pr.user as Record<string, unknown> || {};
      const head = pr.head as Record<string, unknown> || {};
      const base = pr.base as Record<string, unknown> || {};

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
          mergeableState: pr.mergeable_state,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          commits: pr.commits,
          reviewComments: pr.review_comments,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
        },
      };
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

  // ── NEW EXECUTOR: github_update_issue ──
  service.registerToolExecutor('github_update_issue', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const issueNumber = args.issueNumber as number;

      // Build update payload with only provided fields
      const updatePayload: Record<string, unknown> = {};
      if (args.title !== undefined) updatePayload.title = args.title;
      if (args.body !== undefined) updatePayload.body = args.body;
      if (args.state !== undefined) updatePayload.state = args.state;
      if (args.labels !== undefined) updatePayload.labels = args.labels;
      if (args.assignees !== undefined) updatePayload.assignees = args.assignees;

      if (Object.keys(updatePayload).length === 0) {
        return { success: false, error: 'لم يتم تقديم أي حقول للتحديث. يرجى تحديد title أو body أو state أو labels أو assignees.' };
      }

      const result = await githubFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      });

      const updatedFields = Object.keys(updatePayload).join(', ');
      await sendNotification(`🤖 تم تحديث Issue #${issueNumber} (${updatedFields})`, 'success');
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

  // ============== SEARCH EXECUTORS ==============

  // ── NEW EXECUTOR: github_search_code ──
  service.registerToolExecutor('github_search_code', async (args) => {
    try {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const query = args.query as string;
      const fileExtension = args.fileExtension as string | undefined;
      const path = args.path as string | undefined;
      const perPage = (args.perPage as number) || 10;

      // Build search query with repo scope
      let searchQuery = `${query}+repo:${owner}/${repo}`;
      if (fileExtension) searchQuery += `+extension:${fileExtension}`;
      if (path) searchQuery += `+path:${path}`;

      const result = await githubFetch(
        `/search/code?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}`,
        {
          headers: {
            Accept: 'application/vnd.github.text-match+json',
          },
        }
      );

      const items = ((result.items || []) as Array<Record<string, unknown>>).map((item) => {
        const textMatches = (item.text_matches as Array<Record<string, unknown>> || []);
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
    } catch (error) { return { success: false, error: (error as Error).message }; }
  });

  // ============== HISTORY EXECUTORS ==============

  // ── NEW EXECUTOR: github_get_commit_history ──
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
      const commits = (result as unknown as Array<Record<string, unknown>>).map((c) => {
        const commit = c.commit as Record<string, unknown> || {};
        const author = commit.author as Record<string, unknown> || {};
        const committer = commit.committer as Record<string, unknown> || {};
        return {
          sha: (c.sha as string || '').slice(0, 7),
          fullSha: c.sha,
          message: commit.message,
          author: author.name || (c.author as Record<string, unknown>)?.login || '',
          authorEmail: author.email,
          date: author.date || committer.date,
          url: c.html_url,
        };
      });

      return {
        success: true,
        data: {
          branch,
          count: commits.length,
          commits,
        },
      };
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
