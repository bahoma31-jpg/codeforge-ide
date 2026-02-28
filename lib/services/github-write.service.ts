/**
 * CodeForge IDE — GitHub Write Service
 * Full Git Data API integration for atomic multi-file commits.
 *
 * Uses the low-level Git Data API to create a single commit
 * that includes ALL changed files (create/update/delete).
 *
 * Flow: Get HEAD ref → Get base tree → Create new tree → Create commit → Update ref
 *
 * Committer: محمد براهيم <bahoma31@gmail.com>
 */

import { GitHubServiceError } from './github.service';

const GITHUB_API = 'https://api.github.com';

/* ------------------------------------------------------------------ */
/*  Core fetch helper (reused from github.service.ts pattern)          */
/* ------------------------------------------------------------------ */

async function ghFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GitHubServiceError(
      `GitHub API ${res.status}: ${res.statusText}`,
      res.status,
      body
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FileChange {
  /** File path relative to repo root (e.g. "src/index.ts") */
  path: string;
  /** File content (required for create/update, ignored for delete) */
  content?: string;
  /** Operation type */
  action: 'create' | 'update' | 'delete';
}

export interface CommitResult {
  sha: string;
  message: string;
  html_url: string;
  files_changed: number;
}

export interface GitRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}

export interface GitCommit {
  sha: string;
  node_id: string;
  url: string;
  html_url: string;
  message: string;
  tree: { sha: string; url: string };
  parents: Array<{ sha: string; url: string }>;
  author: { name: string; email: string; date: string };
  committer: { name: string; email: string; date: string };
}

export interface GitTreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha?: string | null;
  content?: string;
}

export interface GitTree {
  sha: string;
  url: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

/* ------------------------------------------------------------------ */
/*  Default committer info                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_COMMITTER = {
  name: 'محمد براهيم',
  email: 'bahoma31@gmail.com',
};

/* ------------------------------------------------------------------ */
/*  Git References                                                     */
/* ------------------------------------------------------------------ */

/** Get a Git reference (branch). */
export async function getRef(
  owner: string,
  repo: string,
  ref: string,
  token: string
): Promise<GitRef> {
  return ghFetch<GitRef>(`/repos/${owner}/${repo}/git/ref/heads/${ref}`, token);
}

/** Update a Git reference to point to a new commit. */
export async function updateRef(
  owner: string,
  repo: string,
  ref: string,
  sha: string,
  token: string,
  force = false
): Promise<GitRef> {
  return ghFetch<GitRef>(
    `/repos/${owner}/${repo}/git/refs/heads/${ref}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ sha, force }),
    }
  );
}

/** Create a new Git reference (branch). */
export async function createRef(
  owner: string,
  repo: string,
  ref: string,
  sha: string,
  token: string
): Promise<GitRef> {
  return ghFetch<GitRef>(`/repos/${owner}/${repo}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${ref}`, sha }),
  });
}

/* ------------------------------------------------------------------ */
/*  Git Commits                                                        */
/* ------------------------------------------------------------------ */

/** Get a Git commit object. */
export async function getCommit(
  owner: string,
  repo: string,
  sha: string,
  token: string
): Promise<GitCommit> {
  return ghFetch<GitCommit>(
    `/repos/${owner}/${repo}/git/commits/${sha}`,
    token
  );
}

/** Create a new Git commit. */
export async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentShas: string[],
  token: string
): Promise<GitCommit> {
  return ghFetch<GitCommit>(`/repos/${owner}/${repo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: parentShas,
      author: {
        ...DEFAULT_COMMITTER,
        date: new Date().toISOString(),
      },
      committer: {
        ...DEFAULT_COMMITTER,
        date: new Date().toISOString(),
      },
    }),
  });
}

/* ------------------------------------------------------------------ */
/*  Git Trees                                                          */
/* ------------------------------------------------------------------ */

/** Create a new Git tree. */
export async function createTree(
  owner: string,
  repo: string,
  treeItems: GitTreeItem[],
  baseTreeSha: string,
  token: string
): Promise<GitTree> {
  return ghFetch<GitTree>(`/repos/${owner}/${repo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
}

/* ------------------------------------------------------------------ */
/*  High-Level: Atomic Multi-File Commit                               */
/* ------------------------------------------------------------------ */

/**
 * Push multiple file changes in a single atomic commit.
 *
 * This is the main function for writing to GitHub.
 * It creates one commit containing ALL changes (creates, updates, deletes).
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch to push to (e.g. "main")
 * @param message - Commit message
 * @param changes - Array of file changes
 * @param token - GitHub PAT
 * @param onProgress - Optional progress callback
 * @returns CommitResult with the new commit SHA and URL
 */
export async function pushChanges(
  owner: string,
  repo: string,
  branch: string,
  message: string,
  changes: FileChange[],
  token: string,
  onProgress?: (msg: string, pct: number) => void
): Promise<CommitResult> {
  const report = onProgress || (() => {});

  if (changes.length === 0) {
    throw new Error('لا توجد تغييرات لدفعها.');
  }

  // Step 1: Get the current HEAD commit SHA
  report('جاري جلب آخر commit…', 10);
  const ref = await getRef(owner, repo, branch, token);
  const headSha = ref.object.sha;

  // Step 2: Get the tree SHA that HEAD points to
  report('جاري جلب شجرة الملفات الحالية…', 25);
  const headCommit = await getCommit(owner, repo, headSha, token);
  const baseTreeSha = headCommit.tree.sha;

  // Step 3: Build tree items from changes
  report('جاري تحضير التغييرات…', 40);
  const treeItems: GitTreeItem[] = changes.map((change) => {
    if (change.action === 'delete') {
      // To delete a file, set sha to null
      return {
        path: change.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: null,
      };
    }

    // Create or update: provide content inline
    return {
      path: change.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: change.content || '',
    };
  });

  // Step 4: Create a new tree
  report('جاري إنشاء الشجرة الجديدة…', 55);
  const newTree = await createTree(owner, repo, treeItems, baseTreeSha, token);

  // Step 5: Create a new commit pointing to the new tree
  report('جاري إنشاء الـ commit…', 75);
  const newCommit = await createCommit(
    owner,
    repo,
    message,
    newTree.sha,
    [headSha],
    token
  );

  // Step 6: Update the branch reference to point to new commit
  report('جاري تحديث الفرع…', 90);
  await updateRef(owner, repo, branch, newCommit.sha, token);

  report('تم الدفع بنجاح! ✓', 100);

  return {
    sha: newCommit.sha,
    message: newCommit.message,
    html_url: newCommit.html_url,
    files_changed: changes.length,
  };
}

/* ------------------------------------------------------------------ */
/*  High-Level: Create Branch                                          */
/* ------------------------------------------------------------------ */

/**
 * Create a new branch from an existing branch.
 */
export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  fromBranch: string,
  token: string
): Promise<GitRef> {
  // Get SHA of the source branch
  const sourceRef = await getRef(owner, repo, fromBranch, token);
  // Create new ref
  return createRef(owner, repo, newBranch, sourceRef.object.sha, token);
}

/* ------------------------------------------------------------------ */
/*  High-Level: Get File Content from GitHub                           */
/* ------------------------------------------------------------------ */

interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

/**
 * Get a single file's content from GitHub (for diff comparison).
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string
): Promise<string> {
  const data = await ghFetch<GitHubFileContent>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`,
    token
  );

  if (data.encoding === 'base64') {
    try {
      return atob(data.content.replace(/\n/g, ''));
    } catch {
      return `[Binary file — ${data.size} bytes]`;
    }
  }
  return data.content;
}
