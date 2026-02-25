/**
 * CodeForge IDE - GitHub API Types
 * Agent 5: GitHub Integration
 * 
 * TypeScript types and interfaces for GitHub REST API
 */

/**
 * GitHub User
 */
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  created_at: string;
  updated_at: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

/**
 * GitHub Repository
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string; // "owner/repo"
  owner: GitHubUser;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  git_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number; // KB
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

/**
 * GitHub Commit
 */
export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    comment_count: number;
  };
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
    url: string;
  }>;
  html_url: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files?: GitHubFile[];
}

/**
 * GitHub File Change
 */
export interface GitHubFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string; // For renamed files
}

/**
 * GitHub Branch
 */
export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  protection?: {
    enabled: boolean;
    required_status_checks: {
      enforcement_level: string;
      contexts: string[];
    };
  };
}

/**
 * GitHub Reference
 */
export interface GitHubRef {
  ref: string; // "refs/heads/main"
  node_id: string;
  url: string;
  object: {
    type: 'commit' | 'tag';
    sha: string;
    url: string;
  };
}

/**
 * GitHub Tree
 */
export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

export interface GitHubTreeEntry {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000'; // file, executable, tree, commit, symlink
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

/**
 * GitHub Blob (File Content)
 */
export interface GitHubBlob {
  content: string; // Base64 encoded
  encoding: 'base64' | 'utf-8';
  url: string;
  sha: string;
  size: number;
  node_id: string;
}

/**
 * GitHub Content (Files/Directories)
 */
export interface GitHubContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  encoding?: 'base64' | 'utf-8';
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string | null;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

/**
 * GitHub Compare Response
 */
export interface GitHubCompare {
  base_commit: GitHubCommit;
  merge_base_commit: GitHubCommit;
  status: 'ahead' | 'behind' | 'diverged' | 'identical';
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: GitHubCommit[];
  files: GitHubFile[];
}

/**
 * GitHub Rate Limit
 */
export interface GitHubRateLimit {
  resources: {
    core: RateLimitResource;
    search: RateLimitResource;
    graphql: RateLimitResource;
  };
  rate: RateLimitResource;
}

export interface RateLimitResource {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

/**
 * GitHub Error Response
 */
export interface GitHubError {
  message: string;
  documentation_url?: string;
  status?: number;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

/**
 * GitHub API Response wrapper
 */
export interface GitHubAPIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  rateLimit?: RateLimitResource;
}

/**
 * GitHub Search Repositories Response
 */
export interface GitHubSearchReposResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  perPage: number;
  totalPages?: number;
  totalCount?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * GitHub Authentication Token
 */
export interface GitHubToken {
  token: string;
  type: 'PAT' | 'OAuth'; // Personal Access Token or OAuth
  scopes: string[];
  expiresAt?: string; // For OAuth tokens
  createdAt: string;
}

/**
 * Clone options
 */
export interface CloneOptions {
  owner: string;
  repo: string;
  branch?: string;
  depth?: number; // Shallow clone depth
  recursive?: boolean; // Clone submodules
}

/**
 * Commit options
 */
export interface CommitOptions {
  message: string;
  author?: {
    name: string;
    email: string;
  };
  committer?: {
    name: string;
    email: string;
  };
}

/**
 * Push options
 */
export interface PushOptions {
  branch: string;
  force?: boolean;
  tags?: boolean;
}

/**
 * Pull options
 */
export interface PullOptions {
  branch: string;
  rebase?: boolean;
  tags?: boolean;
}

/**
 * Merge options
 */
export interface MergeOptions {
  source: string; // Branch to merge from
  target: string; // Branch to merge into
  strategy?: 'merge' | 'squash' | 'rebase';
  commitMessage?: string;
}
