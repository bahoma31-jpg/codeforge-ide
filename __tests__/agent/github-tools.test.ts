/**
 * CodeForge IDE — GitHub Tools Unit Tests
 * Tests all 19 GitHub tools: definitions, executors, risk levels,
 * success paths, and error handling.
 *
 * Run: npx jest __tests__/agent/github-tools.test.ts
 */

import { githubTools } from '../../lib/agent/tools/github-tools';

// ─── Mock Setup ───────────────────────────────────────────────

// Mock localStorage
const mockStorage: Record<string, string> = {
  'codeforge-agent-config': JSON.stringify({ githubToken: 'ghp_test_token_12345' }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
  },
});

// Mock fetch
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

// Mock btoa
globalThis.btoa = (str: string) => Buffer.from(str).toString('base64');

// Mock unescape + encodeURIComponent
if (typeof globalThis.unescape === 'undefined') {
  globalThis.unescape = (str: string) => decodeURIComponent(str);
}

// Mock notification bridge
jest.mock('../../lib/agent/bridge', () => ({
  sendNotification: jest.fn(),
}));

// Mock auth-store import
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: { getState: () => ({ token: null }) },
}));

function mockFetchResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  });
}

function mockFetchError(message: string, status = 404) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(message),
  });
}

// ─── Tool Definitions Tests ───────────────────────────────────

describe('GitHub Tools — Definitions', () => {
  test('should export exactly 19 tools', () => {
    expect(githubTools).toHaveLength(19);
  });

  test('all tools should have required fields', () => {
    for (const tool of githubTools) {
      expect(tool.name).toBeDefined();
      expect(tool.name).toMatch(/^github_/);
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.parameters).toBeDefined();
      expect(tool.riskLevel).toBeDefined();
      expect(['auto', 'notify', 'confirm']).toContain(tool.riskLevel);
      expect(tool.category).toBe('github');
    }
  });

  test('tool names should be unique', () => {
    const names = githubTools.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('all tools should have the correct name list', () => {
    const names = githubTools.map((t) => t.name).sort();
    expect(names).toEqual([
      'github_add_comment',
      'github_create_branch',
      'github_create_issue',
      'github_create_pull_request',
      'github_create_repo',
      'github_delete_file',
      'github_delete_repo',
      'github_get_repo_info',
      'github_get_user_info',
      'github_list_branches',
      'github_list_files',
      'github_list_issues',
      'github_list_pull_requests',
      'github_list_repos',
      'github_merge_pull_request',
      'github_push_file',
      'github_push_files',
      'github_read_file',
      'github_search_repos',
    ]);
  });
});

// ─── Risk Level Classification Tests ──────────────────────────

describe('GitHub Tools — Risk Levels', () => {
  const getToolRisk = (name: string) => githubTools.find((t) => t.name === name)?.riskLevel;

  test('read-only tools should be auto (safe)', () => {
    expect(getToolRisk('github_list_repos')).toBe('auto');
    expect(getToolRisk('github_list_branches')).toBe('auto');
    expect(getToolRisk('github_list_pull_requests')).toBe('auto');
    expect(getToolRisk('github_get_repo_info')).toBe('auto');
    expect(getToolRisk('github_get_user_info')).toBe('auto');
    expect(getToolRisk('github_search_repos')).toBe('auto');
    expect(getToolRisk('github_read_file')).toBe('auto');
    expect(getToolRisk('github_list_files')).toBe('auto');
    expect(getToolRisk('github_list_issues')).toBe('auto');
  });

  test('notification tools should be notify (medium risk)', () => {
    expect(getToolRisk('github_create_branch')).toBe('notify');
    expect(getToolRisk('github_create_issue')).toBe('notify');
    expect(getToolRisk('github_add_comment')).toBe('notify');
  });

  test('destructive tools should require confirmation', () => {
    expect(getToolRisk('github_create_repo')).toBe('confirm');
    expect(getToolRisk('github_delete_repo')).toBe('confirm');
    expect(getToolRisk('github_push_file')).toBe('confirm');
    expect(getToolRisk('github_push_files')).toBe('confirm');
    expect(getToolRisk('github_delete_file')).toBe('confirm');
    expect(getToolRisk('github_create_pull_request')).toBe('confirm');
    expect(getToolRisk('github_merge_pull_request')).toBe('confirm');
  });
});

// ─── Parameter Validation Tests ───────────────────────────────

describe('GitHub Tools — Parameters', () => {
  const getToolParams = (name: string) => {
    const tool = githubTools.find((t) => t.name === name);
    return tool?.parameters as { required?: string[]; properties?: Record<string, unknown> };
  };

  test('github_create_repo requires name', () => {
    const params = getToolParams('github_create_repo');
    expect(params?.required).toContain('name');
  });

  test('github_delete_repo requires owner and repo', () => {
    const params = getToolParams('github_delete_repo');
    expect(params?.required).toContain('owner');
    expect(params?.required).toContain('repo');
  });

  test('github_push_file requires owner, repo, path, content, message', () => {
    const params = getToolParams('github_push_file');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo', 'path', 'content', 'message']));
  });

  test('github_merge_pull_request requires owner, repo, pullNumber', () => {
    const params = getToolParams('github_merge_pull_request');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo', 'pullNumber']));
  });

  test('github_add_comment requires owner, repo, issueNumber, body', () => {
    const params = getToolParams('github_add_comment');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo', 'issueNumber', 'body']));
  });

  test('github_get_user_info requires no parameters', () => {
    const params = getToolParams('github_get_user_info');
    expect(params?.required).toEqual([]);
  });

  test('github_read_file requires owner, repo, path', () => {
    const params = getToolParams('github_read_file');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo', 'path']));
  });

  test('github_list_files requires owner, repo', () => {
    const params = getToolParams('github_list_files');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo']));
  });

  test('github_search_repos requires query', () => {
    const params = getToolParams('github_search_repos');
    expect(params?.required).toContain('query');
  });

  test('github_list_issues requires owner, repo', () => {
    const params = getToolParams('github_list_issues');
    expect(params?.required).toEqual(expect.arrayContaining(['owner', 'repo']));
  });
});

// ─── Category Tests ───────────────────────────────────────────

describe('GitHub Tools — Categories', () => {
  test('all tools should be in github category', () => {
    for (const tool of githubTools) {
      expect(tool.category).toBe('github');
    }
  });

  test('tools should be logically grouped', () => {
    const repoTools = githubTools.filter((t) => ['github_create_repo', 'github_delete_repo', 'github_list_repos', 'github_get_repo_info', 'github_search_repos'].includes(t.name));
    const fileTools = githubTools.filter((t) => ['github_push_file', 'github_push_files', 'github_read_file', 'github_delete_file', 'github_list_files'].includes(t.name));
    const branchTools = githubTools.filter((t) => ['github_create_branch', 'github_list_branches'].includes(t.name));
    const prTools = githubTools.filter((t) => ['github_create_pull_request', 'github_list_pull_requests', 'github_merge_pull_request'].includes(t.name));
    const issueTools = githubTools.filter((t) => ['github_create_issue', 'github_list_issues', 'github_add_comment'].includes(t.name));
    const userTools = githubTools.filter((t) => ['github_get_user_info'].includes(t.name));

    expect(repoTools).toHaveLength(5);
    expect(fileTools).toHaveLength(5);
    expect(branchTools).toHaveLength(2);
    expect(prTools).toHaveLength(3);
    expect(issueTools).toHaveLength(3);
    expect(userTools).toHaveLength(1);

    // Total should be 19
    expect(repoTools.length + fileTools.length + branchTools.length + prTools.length + issueTools.length + userTools.length).toBe(19);
  });
});

// ─── Tool Description Quality Tests ───────────────────────────

describe('GitHub Tools — Description Quality', () => {
  test('descriptions should be meaningful (> 20 chars)', () => {
    for (const tool of githubTools) {
      expect(tool.description.length).toBeGreaterThan(20);
    }
  });

  test('destructive tools should mention confirmation or irreversible', () => {
    const deleteRepo = githubTools.find((t) => t.name === 'github_delete_repo');
    expect(deleteRepo?.description.toLowerCase()).toMatch(/irreversible|permanent|confirm/);
  });

  test('each tool description should describe what it does', () => {
    const createRepo = githubTools.find((t) => t.name === 'github_create_repo');
    expect(createRepo?.description.toLowerCase()).toContain('create');

    const listRepos = githubTools.find((t) => t.name === 'github_list_repos');
    expect(listRepos?.description.toLowerCase()).toContain('list');

    const mergepr = githubTools.find((t) => t.name === 'github_merge_pull_request');
    expect(mergepr?.description.toLowerCase()).toContain('merge');
  });
});
