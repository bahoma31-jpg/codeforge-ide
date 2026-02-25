/**
 * CodeForge IDE - GitHub API Client
 * Agent 5: GitHub Integration
 * 
 * Complete GitHub REST API wrapper with rate limiting,
 * error handling, and response caching
 */

import {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubBranch,
  GitHubRef,
  GitHubTree,
  GitHubBlob,
  GitHubContent,
  GitHubCompare,
  GitHubRateLimit,
  GitHubError,
  GitHubAPIResponse,
  GitHubSearchReposResponse,
  PaginationInfo,
} from './github-types';
import { githubAuth } from './github-auth';

const GITHUB_API_BASE = 'https://api.github.com';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

/**
 * Response cache
 */
const responseCache = new Map<string, CacheEntry<any>>();

/**
 * Rate limit state
 */
let rateLimitState: GitHubRateLimit['rate'] | null = null;

/**
 * GitHub API Client
 */
export class GitHub {
  /**
   * Make authenticated API request
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GitHubAPIResponse<T>> {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return {
          data: cached.data,
          status: 200,
          headers: {},
        };
      }
    }

    // Add authentication
    const headers = {
      ...githubAuth.getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Update rate limit
      this.updateRateLimit(response.headers);

      // Handle errors
      if (!response.ok) {
        const error: GitHubError = await response.json();
        error.status = response.status;
        throw error;
      }

      const data: T = await response.json();

      // Cache successful GET responses
      if (!options.method || options.method === 'GET') {
        responseCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag: response.headers.get('etag') || undefined,
        });
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        rateLimit: rateLimitState || undefined,
      };
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      throw new Error(`GitHub API request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Update rate limit state from response headers
   */
  private static updateRateLimit(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const used = headers.get('x-ratelimit-used');

    if (limit && remaining && reset) {
      rateLimitState = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        used: used ? parseInt(used) : 0,
      };
    }
  }

  /**
   * Get current rate limit status
   */
  static async getRateLimit(): Promise<GitHubRateLimit> {
    const response = await this.request<GitHubRateLimit>('/rate_limit');
    return response.data;
  }

  /**
   * Get authenticated user
   */
  static async getAuthenticatedUser(): Promise<GitHubUser> {
    const response = await this.request<GitHubUser>('/user');
    return response.data;
  }

  /**
   * Get user by username
   */
  static async getUser(username: string): Promise<GitHubUser> {
    const response = await this.request<GitHubUser>(`/users/${username}`);
    return response.data;
  }

  /**
   * List user repositories
   */
  static async listUserRepos(
    username?: string,
    options?: {
      type?: 'all' | 'owner' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }
  ): Promise<GitHubRepository[]> {
    const user = username || 'user';
    const endpoint = username ? `/users/${username}/repos` : '/user/repos';
    
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.sort) params.append('sort', options.sort);
    if (options?.direction) params.append('direction', options.direction);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.per_page) params.append('per_page', options.per_page.toString());

    const url = params.toString() ? `${endpoint}?${params}` : endpoint;
    const response = await this.request<GitHubRepository[]>(url);
    return response.data;
  }

  /**
   * Get repository
   */
  static async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
    return response.data;
  }

  /**
   * Search repositories
   */
  static async searchRepositories(
    query: string,
    options?: {
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
      order?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }
  ): Promise<GitHubSearchReposResponse> {
    const params = new URLSearchParams({ q: query });
    if (options?.sort) params.append('sort', options.sort);
    if (options?.order) params.append('order', options.order);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.per_page) params.append('per_page', options.per_page.toString());

    const response = await this.request<GitHubSearchReposResponse>(`/search/repositories?${params}`);
    return response.data;
  }

  /**
   * Create repository
   */
  static async createRepository(data: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  }): Promise<GitHubRepository> {
    const response = await this.request<GitHubRepository>('/user/repos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Fork repository
   */
  static async forkRepository(
    owner: string,
    repo: string,
    organization?: string
  ): Promise<GitHubRepository> {
    const data = organization ? { organization } : {};
    const response = await this.request<GitHubRepository>(
      `/repos/${owner}/${repo}/forks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  /**
   * List branches
   */
  static async listBranches(
    owner: string,
    repo: string,
    options?: { protected?: boolean; page?: number; per_page?: number }
  ): Promise<GitHubBranch[]> {
    const params = new URLSearchParams();
    if (options?.protected !== undefined) params.append('protected', options.protected.toString());
    if (options?.page) params.append('page', options.page.toString());
    if (options?.per_page) params.append('per_page', options.per_page.toString());

    const url = params.toString()
      ? `/repos/${owner}/${repo}/branches?${params}`
      : `/repos/${owner}/${repo}/branches`;
    const response = await this.request<GitHubBranch[]>(url);
    return response.data;
  }

  /**
   * Get branch
   */
  static async getBranch(owner: string, repo: string, branch: string): Promise<GitHubBranch> {
    const response = await this.request<GitHubBranch>(`/repos/${owner}/${repo}/branches/${branch}`);
    return response.data;
  }

  /**
   * Create branch
   */
  static async createBranch(
    owner: string,
    repo: string,
    branch: string,
    sha: string
  ): Promise<GitHubRef> {
    const response = await this.request<GitHubRef>(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha,
      }),
    });
    return response.data;
  }

  /**
   * Delete branch
   */
  static async deleteBranch(owner: string, repo: string, branch: string): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'DELETE',
    });
  }

  /**
   * List commits
   */
  static async listCommits(
    owner: string,
    repo: string,
    options?: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (options?.sha) params.append('sha', options.sha);
    if (options?.path) params.append('path', options.path);
    if (options?.author) params.append('author', options.author);
    if (options?.since) params.append('since', options.since);
    if (options?.until) params.append('until', options.until);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.per_page) params.append('per_page', options.per_page.toString());

    const url = params.toString()
      ? `/repos/${owner}/${repo}/commits?${params}`
      : `/repos/${owner}/${repo}/commits`;
    const response = await this.request<GitHubCommit[]>(url);
    return response.data;
  }

  /**
   * Get commit
   */
  static async getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    const response = await this.request<GitHubCommit>(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  }

  /**
   * Compare commits
   */
  static async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<GitHubCompare> {
    const response = await this.request<GitHubCompare>(
      `/repos/${owner}/${repo}/compare/${base}...${head}`
    );
    return response.data;
  }

  /**
   * Get tree
   */
  static async getTree(
    owner: string,
    repo: string,
    sha: string,
    recursive: boolean = false
  ): Promise<GitHubTree> {
    const url = recursive
      ? `/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`
      : `/repos/${owner}/${repo}/git/trees/${sha}`;
    const response = await this.request<GitHubTree>(url);
    return response.data;
  }

  /**
   * Get blob (file content)
   */
  static async getBlob(owner: string, repo: string, sha: string): Promise<GitHubBlob> {
    const response = await this.request<GitHubBlob>(`/repos/${owner}/${repo}/git/blobs/${sha}`);
    return response.data;
  }

  /**
   * Get contents (file or directory)
   */
  static async getContents(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubContent | GitHubContent[]> {
    const url = ref
      ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
      : `/repos/${owner}/${repo}/contents/${path}`;
    const response = await this.request<GitHubContent | GitHubContent[]>(url);
    return response.data;
  }

  /**
   * Create or update file
   */
  static async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    data: {
      message: string;
      content: string; // Base64 encoded
      sha?: string; // Required for updates
      branch?: string;
      committer?: {
        name: string;
        email: string;
      };
      author?: {
        name: string;
        email: string;
      };
    }
  ): Promise<{ content: GitHubContent; commit: GitHubCommit }> {
    const response = await this.request<{ content: GitHubContent; commit: GitHubCommit }>(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  /**
   * Delete file
   */
  static async deleteFile(
    owner: string,
    repo: string,
    path: string,
    data: {
      message: string;
      sha: string;
      branch?: string;
      committer?: {
        name: string;
        email: string;
      };
      author?: {
        name: string;
        email: string;
      };
    }
  ): Promise<{ commit: GitHubCommit }> {
    const response = await this.request<{ commit: GitHubCommit }>(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'DELETE',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: responseCache.size,
      entries: Array.from(responseCache.keys()),
    };
  }

  /**
   * Get current rate limit state
   */
  static getCurrentRateLimit(): typeof rateLimitState {
    return rateLimitState;
  }
}

/**
 * Export singleton instance
 */
export const github = GitHub;
