export interface GitHubRepository {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha?: string;
  content?: string;
}

export interface GitHubPushResult {
  success: boolean;
  commitSha: string;
  message: string;
}

export interface GitHubAuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
}
