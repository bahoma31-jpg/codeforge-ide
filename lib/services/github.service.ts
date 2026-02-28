/**
 * CodeForge IDE — GitHub Service
 * Complete GitHub API integration for browser-based IDE.
 * Uses fetch-based API calls (no server dependency).
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FileNode } from '@/lib/db/schema';
import {
  createFile as dbCreateFile,
  createFolder as dbCreateFolder,
  clearAllFiles,
} from '@/lib/db/file-operations';
import { useFilesStore } from '@/lib/stores/files-store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

/* ------------------------------------------------------------------ */
/*  Core API helper                                                    */
/* ------------------------------------------------------------------ */

const GITHUB_API = 'https://api.github.com';

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

  return res.json() as Promise<T>;
}

export class GitHubServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = 'GitHubServiceError';
  }
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

/** Validate a Personal Access Token by fetching the authenticated user. */
export async function validateToken(token: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>('/user', token);
}

/* ------------------------------------------------------------------ */
/*  Repositories                                                       */
/* ------------------------------------------------------------------ */

/** List repos for the authenticated user (sorted by update). */
export async function listRepos(
  token: string,
  page = 1,
  perPage = 30
): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>(
    `/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
    token
  );
}

/** Search public repositories. */
export async function searchRepos(
  query: string,
  token: string,
  page = 1
): Promise<{ items: GitHubRepo[] }> {
  return ghFetch(
    `/search/repositories?q=${encodeURIComponent(query)}&per_page=20&page=${page}`,
    token
  );
}

/** Get a single repo by owner/name. */
export async function getRepo(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubRepo> {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token);
}

/* ------------------------------------------------------------------ */
/*  Clone (tree-based)                                                 */
/* ------------------------------------------------------------------ */

/**
 * Clone a repository into the local IndexedDB file system.
 * Uses the Git Trees API to fetch the full tree in one call,
 * then fetches blob content for each file.
 */
export async function cloneRepository(
  owner: string,
  repo: string,
  token: string,
  branch?: string,
  onProgress?: (msg: string, pct: number) => void
): Promise<{ imported: number; repoName: string }> {
  const report = onProgress || (() => {});

  // 1. Get repo info to resolve default branch
  report('جاري جلب معلومات المستودع…', 5);
  const repoInfo = await getRepo(owner, repo, token);
  const ref = branch || repoInfo.default_branch;

  // 2. Fetch the full tree recursively
  report(`جاري جلب شجرة الملفات (${ref})…`, 15);
  const tree = await ghFetch<GitHubTree>(
    `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
    token
  );

  if (tree.truncated) {
    console.warn('Repository tree was truncated — some files may be missing.');
  }

  // 3. Clear existing files
  report('تحضير نظام الملفات…', 20);
  await clearAllFiles();

  // 4. Create root folder
  const root = await dbCreateFolder(repoInfo.name, null);

  // 5. Create folder structure first
  const folderMap = new Map<string, string>();
  folderMap.set('', root.id); // root

  const folders = tree.tree
    .filter((item) => item.type === 'tree')
    .sort((a, b) => a.path.localeCompare(b.path));

  for (const folder of folders) {
    const parts = folder.path.split('/');
    const parentPath = parts.slice(0, -1).join('/');
    const parentId = folderMap.get(parentPath) || root.id;
    const created = await dbCreateFolder(parts[parts.length - 1], parentId);
    folderMap.set(folder.path, created.id);
  }

  // 6. Fetch and create files
  const blobs = tree.tree.filter(
    (item) => item.type === 'blob' && (item.size || 0) < 500_000 // skip files > 500KB
  );

  let imported = 0;
  const total = blobs.length;

  for (const blob of blobs) {
    const pct = 25 + Math.round((imported / total) * 70);
    report(`جاري جلب ${blob.path}…`, pct);

    try {
      // Fetch blob content
      const blobData = await ghFetch<{ content: string; encoding: string }>(
        `/repos/${owner}/${repo}/git/blobs/${blob.sha}`,
        token
      );

      let content = '';
      if (blobData.encoding === 'base64') {
        try {
          content = atob(blobData.content.replace(/\n/g, ''));
        } catch {
          content = `[Binary file — ${blob.size || 0} bytes]`;
        }
      } else {
        content = blobData.content;
      }

      // Determine parent folder
      const parts = blob.path.split('/');
      const parentPath = parts.slice(0, -1).join('/');
      const parentId = folderMap.get(parentPath) || root.id;
      const fileName = parts[parts.length - 1];

      await dbCreateFile(fileName, parentId, content, detectLang(fileName));
      imported++;
    } catch (err) {
      console.warn(`Skipped ${blob.path}:`, err);
    }
  }

  // 7. Reload tree
  report('اكتمل الاستنساخ!', 100);
  await useFilesStore.getState().loadFileTree();

  return { imported, repoName: repoInfo.name };
}

/* ------------------------------------------------------------------ */
/*  Branches                                                           */
/* ------------------------------------------------------------------ */

export interface GitHubBranch {
  name: string;
  commit: { sha: string };
  protected: boolean;
}

export async function listBranches(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubBranch[]> {
  return ghFetch<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`, token);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function detectLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    svg: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    mdx: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile',
    toml: 'toml',
    txt: 'plaintext',
    gitignore: 'plaintext',
  };
  return map[ext] || 'plaintext';
}
