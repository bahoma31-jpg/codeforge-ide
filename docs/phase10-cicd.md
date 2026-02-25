# Phase 10: CI/CD Pipeline Documentation

## Overview

Phase 10 introduces a complete CI/CD pipeline for the CodeForge IDE project. This includes automated testing, linting, type checking, and deployment workflows that run on every push and pull request, ensuring code quality and reliable deployments.

---

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- `push` to `main` and `feature/**` branches
- `pull_request` targeting `main`

**Node Matrix:** 18.x and 20.x

**Steps (in order):**
1. **Checkout** — Clones the repository
2. **Setup Node.js** — Installs the specified Node version with npm cache
3. **Install dependencies** — `npm ci` for clean, reproducible installs
4. **Lint** — `npm run lint` to check code style and quality
5. **Type check** — `npx tsc --noEmit` to verify TypeScript types
6. **Unit tests** — `npm run test:run`
7. **Integration tests** — `npm run test:integration`
8. **Coverage** — `npm run test:coverage` + uploads coverage artifact
9. **Build** — `npm run build` to ensure the project compiles

**Behavior:** Any step failure immediately stops the pipeline. Coverage artifacts are uploaded for each Node version.

---

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Trigger:** `push` to `main` only

**Steps:**
1. Checkout and setup Node.js 20.x
2. Install dependencies and build
3. Deploy to Vercel using `amondnet/vercel-action@v25`
4. Health check with retry (5 attempts, 10s interval)

**Behavior:** Deployment only happens after a successful build. Health check must return HTTP 200.

---

### 3. PR Checks (`.github/workflows/pr-checks.yml`)

**Trigger:** `pull_request` events (opened, edited, synchronize)

**Jobs:**
- **Validate PR Title** — Ensures the title follows Conventional Commits format (e.g., `feat:`, `fix:`, `ci(phase10):`).
- **Check PR Size** — Issues a `::notice` warning if the PR exceeds 500 lines changed. This is a warning only and does NOT block the PR.

---

## Adding GitHub Secrets

The deploy workflow requires three secrets. To add them:

1. Go to your repository on GitHub: `Settings` → `Secrets and variables` → `Actions`
2. Click **"New repository secret"**
3. Add each of the following:

| Secret Name | Description | Where to Find |
|---|---|---|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | The Vercel project ID | Vercel Dashboard → Project → Settings → General |

4. (Optional) Add `PRODUCTION_URL` as a fallback for health checks.

---

## Connecting Vercel to the Repository

1. **Create a Vercel account** at [vercel.com](https://vercel.com) if you don't have one.
2. **Import your repository:**
   - Go to Vercel Dashboard → "Add New" → "Project"
   - Select "Import Git Repository"
   - Choose `bahoma31-jpg/codeforge-ide`
3. **Configure the project:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm ci`
   - Output Directory: `.next` (default)
4. **Get your IDs:**
   - After creating the project, go to Project Settings → General
   - Copy `Project ID` and `Org ID`
5. **Generate a token:**
   - Go to Account Settings → Tokens → Create Token
   - Name it (e.g., "GitHub Actions Deploy")
   - Copy the token immediately (it won't be shown again)
6. **Add all three values as GitHub Secrets** (see section above).

---

## Running Checks Locally

You can run the same checks that CI runs:

```bash
# Install dependencies (clean)
npm ci

# Lint
npm run lint

# TypeScript type check
npx tsc --noEmit

# Unit tests
npm run test:run

# Integration tests
npm run test:integration

# Tests with coverage report
npm run test:coverage

# Build
npm run build
```

**Pro tip:** Run all checks in sequence before pushing:
```bash
npm ci && npm run lint && npx tsc --noEmit && npm run test:run && npm run test:integration && npm run test:coverage && npm run build
```

---

## Troubleshooting

### Common CI Errors

| Error | Cause | Fix |
|---|---|---|
| `npm ci` fails with lockfile mismatch | `package-lock.json` is out of sync | Run `npm install` locally and commit the updated lockfile |
| TypeScript errors (`tsc --noEmit`) | Type mismatches or missing types | Fix the types locally; run `npx tsc --noEmit` to verify |
| Lint failures | ESLint rule violations | Run `npm run lint -- --fix` to auto-fix, then review remaining issues |
| Test timeouts | Slow or hanging tests | Check for async operations without proper cleanup; increase timeout if needed |
| Node version mismatch | Using features not available in Node 18.x | Ensure compatibility with both 18.x and 20.x |
| Build failure | Next.js build errors | Check for runtime imports in server components, missing env vars, etc. |

### Vercel Deploy Errors

| Error | Cause | Fix |
|---|---|---|
| 401 Unauthorized | Invalid `VERCEL_TOKEN` | Regenerate the token in Vercel and update the GitHub secret |
| Project not found | Wrong `VERCEL_PROJECT_ID` | Verify the ID in Vercel Dashboard → Project Settings |
| Health check fails (non-200) | App crash or slow cold start | Check Vercel deployment logs; increase health check retries if needed |
| Build succeeds but deploy fails | Vercel-specific config issue | Check `vercel.json` and Vercel build logs |

---

## File Structure

```
.github/
├── dependabot.yml
└── workflows/
    ├── ci.yml
    ├── deploy.yml
    └── pr-checks.yml
vercel.json
docs/
├── phase10-cicd.md
└── PHASE10_CHECKLIST.md
```
