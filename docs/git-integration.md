# 🔗 Git Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [GitHub OAuth Setup](#github-oauth-setup)
3. [Authentication Flow](#authentication-flow)
4. [Supported Git Operations](#supported-git-operations)
5. [Working with Repositories](#working-with-repositories)
6. [Branch Management](#branch-management)
7. [Commit History](#commit-history)
8. [Conflict Resolution](#conflict-resolution)
9. [Troubleshooting](#troubleshooting)

---

## Overview

CodeForge IDE provides full Git integration powered by:

- **isomorphic-git**: Pure JavaScript Git implementation
- **Lightning FS**: IndexedDB-based file system for Git objects
- **GitHub API**: OAuth authentication and remote operations

### Features

✅ **Local Git Operations**
- Initialize repositories
- Stage and unstage files
- Commit changes
- View commit history
- Branch creation and switching

✅ **Remote Operations**
- Push to GitHub
- Pull from GitHub
- Clone repositories
- Fetch updates

✅ **GitHub Integration**
- OAuth authentication
- Browse user repositories
- View organizations
- Manage branches via GitHub API

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:

```
Application name: CodeForge IDE
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

4. Click **"Register application"**
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Step 3: Restart Development Server

```bash
npm run dev
```

---

## Authentication Flow

### OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      CodeForge IDE                         │
│                  (User clicks "Sign In")                  │
└─────────────────────────────────────────────────────────┘
                             │
                             ↓
                    Redirect to GitHub
                             │
                             ↓
┌─────────────────────────────────────────────────────────┐
│                    GitHub OAuth                          │
│          (User authorizes application)                  │
└─────────────────────────────────────────────────────────┘
                             │
                             ↓
            Callback with authorization code
                             │
                             ↓
┌─────────────────────────────────────────────────────────┐
│                   NextAuth.js                           │
│         Exchange code for access token                 │
└─────────────────────────────────────────────────────────┘
                             │
                             ↓
                    Store in session
                             │
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  User Authenticated                      │
│            Redirect back to application                │
└─────────────────────────────────────────────────────────┘
```

### Authentication Code

```typescript
import { signIn, signOut, useSession } from 'next-auth/react';

// Sign in
const handleSignIn = () => {
  signIn('github', { callbackUrl: '/' });
};

// Sign out
const handleSignOut = () => {
  signOut({ callbackUrl: '/' });
};

// Check session
const { data: session, status } = useSession();

if (status === 'authenticated') {
  console.log('User:', session.user);
  console.log('Access Token:', session.accessToken);
}
```

---

## Supported Git Operations

### 1. Initialize Repository

```typescript
import { gitStore } from '@/store/git-store';

// Initialize a new Git repository
await gitStore.getState().initRepo();
```

**What it does:**
- Creates `.git` directory in IndexedDB
- Initializes default branch (main)
- Sets up Git configuration

### 2. Stage Files

```typescript
// Stage a single file
await gitStore.getState().stageFile('src/index.ts');

// Stage multiple files
await gitStore.getState().stageFiles([
  'src/index.ts',
  'src/utils.ts',
]);

// Stage all changes
await gitStore.getState().stageAllChanges();
```

### 3. Unstage Files

```typescript
// Unstage a file
await gitStore.getState().unstageFile('src/index.ts');
```

### 4. Commit Changes

```typescript
// Commit with message
await gitStore.getState().commit('feat: add new feature');

// Commit with author
await gitStore.getState().commit('fix: resolve bug', {
  author: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});
```

### 5. Push to Remote

```typescript
// Push current branch
await gitStore.getState().push();

// Push specific branch
await gitStore.getState().push('feature/new-feature');
```

### 6. Pull from Remote

```typescript
// Pull and merge
await gitStore.getState().pull();

// Pull with rebase
await gitStore.getState().pull({ rebase: true });
```

### 7. Clone Repository

```typescript
// Clone from GitHub
await gitStore.getState().cloneRepo({
  url: 'https://github.com/user/repo.git',
  dir: '/my-project',
});
```

---

## Working with Repositories

### List User Repositories

```typescript
import { getRepositories } from '@/lib/github/api';

const repos = await getRepositories();

repos.forEach((repo) => {
  console.log(repo.name);
  console.log(repo.html_url);
  console.log(repo.default_branch);
});
```

### Get Repository Details

```typescript
const repo = await getRepository('owner', 'repo-name');

console.log(repo.description);
console.log(repo.stars);
console.log(repo.forks);
```

### Create Repository

```typescript
const newRepo = await createRepository({
  name: 'my-new-repo',
  description: 'A new project',
  private: false,
});
```

---

## Branch Management

### List Branches

```typescript
// List local branches
const branches = await gitStore.getState().listBranches();

// List remote branches
const remoteBranches = await gitStore.getState().listRemoteBranches();
```

### Create Branch

```typescript
// Create new branch
await gitStore.getState().createBranch('feature/new-feature');

// Create from specific commit
await gitStore.getState().createBranch('hotfix/bug', {
  startPoint: 'abc123',
});
```

### Switch Branch

```typescript
// Checkout branch
await gitStore.getState().checkoutBranch('feature/new-feature');
```

### Delete Branch

```typescript
// Delete local branch
await gitStore.getState().deleteBranch('old-feature');

// Delete remote branch
await gitStore.getState().deleteRemoteBranch('old-feature');
```

### Merge Branches

```typescript
// Merge branch into current
await gitStore.getState().mergeBranch('feature/new-feature');
```

---

## Commit History

### View Commit Log

```typescript
// Get recent commits
const commits = await gitStore.getState().getCommitHistory();

commits.forEach((commit) => {
  console.log(commit.sha);
  console.log(commit.message);
  console.log(commit.author);
  console.log(commit.date);
});
```

### View Commit Details

```typescript
// Get specific commit
const commit = await gitStore.getState().getCommit('abc123');

console.log('Files changed:', commit.files);
console.log('Insertions:', commit.stats.insertions);
console.log('Deletions:', commit.stats.deletions);
```

### View File History

```typescript
// Get commits that modified a file
const history = await gitStore.getState().getFileHistory('src/index.ts');
```

---

## Conflict Resolution

### Detecting Conflicts

```typescript
try {
  await gitStore.getState().mergeBranch('feature/branch');
} catch (error) {
  if (error.code === 'MERGE_CONFLICT') {
    console.log('Conflicts detected:', error.conflicts);
  }
}
```

### Conflict Structure

```typescript
interface Conflict {
  path: string;
  ours: string;    // Current branch content
  theirs: string;  // Merging branch content
  base: string;    // Common ancestor content
}
```

### Resolving Conflicts

**Manual Resolution:**

```typescript
// 1. Get conflicts
const conflicts = gitStore.getState().conflicts;

// 2. Resolve each file
for (const conflict of conflicts) {
  // User edits the file manually
  const resolved = await editFile(conflict.path);
  
  // 3. Stage resolved file
  await gitStore.getState().stageFile(conflict.path);
}

// 4. Complete merge
await gitStore.getState().commit('Merge branch with conflict resolution');
```

**Automated Resolution:**

```typescript
// Accept ours (current branch)
await gitStore.getState().resolveConflict('src/index.ts', 'ours');

// Accept theirs (merging branch)
await gitStore.getState().resolveConflict('src/index.ts', 'theirs');
```

### Conflict Markers

When conflicts occur, files contain markers:

```diff
function example() {
<<<<<<< HEAD (Current branch)
  return "our version";
=======
  return "their version";
>>>>>>> feature/branch (Merging branch)
}
```

**Resolution Strategy:**
1. Remove conflict markers
2. Keep desired code
3. Stage the file
4. Commit the merge

---

## Troubleshooting

### Common Issues

#### 1. **Authentication Failed**

**Problem:** "Authentication required" error

**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_GITHUB_CLIENT_ID
echo $GITHUB_CLIENT_SECRET

# Restart dev server
npm run dev
```

#### 2. **Push Rejected**

**Problem:** "Updates were rejected" error

**Solution:**
```typescript
// Pull before push
await gitStore.getState().pull();
await gitStore.getState().push();
```

#### 3. **Merge Conflicts**

**Problem:** Cannot complete merge

**Solution:**
```typescript
// Abort merge
await gitStore.getState().abortMerge();

// Or resolve conflicts
await gitStore.getState().resolveAllConflicts('ours');
```

#### 4. **IndexedDB Full**

**Problem:** "QuotaExceededError"

**Solution:**
```typescript
// Clear old repositories
await gitStore.getState().deleteRepo('/old-project');

// Or request more storage
if (navigator.storage && navigator.storage.persist) {
  await navigator.storage.persist();
}
```

---

## Git Configuration

### Set User Info

```typescript
import { setGitConfig } from '@/lib/git/config';

await setGitConfig('user.name', 'John Doe');
await setGitConfig('user.email', 'john@example.com');
```

### Get Configuration

```typescript
const name = await getGitConfig('user.name');
const email = await getGitConfig('user.email');
```

---

## Best Practices

### 1. **Commit Messages**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

### 2. **Branch Naming**

```
feature/feature-name
bugfix/bug-description
hotfix/critical-fix
release/version-number
```

### 3. **Frequent Commits**

- Commit often with small, logical changes
- Write descriptive commit messages
- Don't commit broken code

### 4. **Pull Before Push**

```typescript
// Always pull first to avoid conflicts
await gitStore.getState().pull();
await gitStore.getState().push();
```

---

## Advanced Features

### Rebase

```typescript
// Rebase current branch onto main
await gitStore.getState().rebase('main');
```

### Cherry-Pick

```typescript
// Apply specific commit to current branch
await gitStore.getState().cherryPick('abc123');
```

### Tags

```typescript
// Create tag
await gitStore.getState().createTag('v1.0.0', 'Release version 1.0.0');

// List tags
const tags = await gitStore.getState().listTags();

// Delete tag
await gitStore.getState().deleteTag('v0.9.0');
```

### Stash

```typescript
// Stash changes
await gitStore.getState().stash('Work in progress');

// Apply stash
await gitStore.getState().stashPop();

// List stashes
const stashes = await gitStore.getState().listStashes();
```

---

## Performance Tips

### 1. **Shallow Clones**

```typescript
// Clone with depth 1 (faster)
await gitStore.getState().cloneRepo({
  url: 'https://github.com/user/repo.git',
  depth: 1,
});
```

### 2. **Sparse Checkout**

```typescript
// Clone only specific directories
await gitStore.getState().sparseCheckout({
  url: 'https://github.com/user/repo.git',
  paths: ['src/', 'docs/'],
});
```

### 3. **Prune Old Objects**

```typescript
// Clean up unused Git objects
await gitStore.getState().gc();
```

---

**Last Updated**: Phase 8 (February 2026)
