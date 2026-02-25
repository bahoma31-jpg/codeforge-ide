# Phase 10: CI/CD Pipeline Documentation

## Overview

Phase 10 introduces a complete CI/CD pipeline for the **CodeForge IDE** project. This ensures automated quality gates (lint, typecheck, tests, build) on every push and pull request, automated deployment to Vercel on `main`, and dependency management via Dependabot.

---

## How the Workflows Work

### 1. CI Pipeline — `.github/workflows/ci.yml`

**Purpose:** Validate code quality on every change.

**Triggers:**
- `push` to `main` and `feature/**` branches
- `pull_request` targeting `main`

**Node Matrix:** Runs on both Node 18.x and 20.x in parallel.

**Pipeline Steps (sequential, fail-fast):**

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `actions/checkout@v4` | Clone the repository |
| 2 | `actions/setup-node@v4` | Install Node.js with npm cache |
| 3 | `npm ci` | Clean install of dependencies |
| 4 | `npm run lint` | ESLint code quality check |
| 5 | `npx tsc --noEmit` | TypeScript type verification |
| 6 | `npm run test:run` | Run unit tests |
| 7 | `npm run test:integration` | Run integration tests |
| 8 | `npm run test:coverage` | Generate coverage report |
| 9 | `actions/upload-artifact@v4` | Upload coverage/ as artifact |
| 10 | `npm run build` | Verify production build |

**Behavior:**
- Any step failure stops the entire pipeline immediately (`fail-fast: true`)
- Coverage artifact is uploaded for **each** Node version
- Concurrency group prevents duplicate runs on the same ref

---

### 2. Deploy Workflow — `.github/workflows/deploy.yml`

**Purpose:** Deploy to Vercel production on every push to main.

**Trigger:** `push` to `main` only.

**Steps:**
1. Checkout + Setup Node.js 20.x
2. `npm ci` + `npm run build`
3. Deploy to Vercel using `amondnet/vercel-action@v25` with `--prod` flag
4. Health check: 5 retry attempts with 10s interval, expecting HTTP 200

**Behavior:**
- Deployment only happens after successful build
- Concurrency: only one production deploy at a time (no cancellation)
- Health check is mandatory; failure = pipeline failure

---

### 3. PR Checks — `.github/workflows/pr-checks.yml`

**Purpose:** Lightweight validation for pull requests.

**Trigger:** `pull_request` events (opened, edited, synchronize) to `main`.

**Jobs:**

| Job | What it does | Blocking? |
|-----|--------------|-----------|
| `validate-pr-title` | Checks title follows Conventional Commits format | ✅ Yes |
| `check-pr-size` | Warns if total changes > 500 lines | ⚠️ No (notice only) |

**Accepted PR title prefixes:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

---

## How to Add Secrets in GitHub

The deploy workflow requires three secrets:

1. Navigate to: **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add each secret:

| Secret Name | Description | Where to Find It |
|-------------|-------------|-------------------|
| `VERCEL_TOKEN` | API authentication token | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization/team identifier | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Project identifier | Vercel → Project → Settings → General |

**Optional:** Add `PRODUCTION_URL` as a fallback for health checks.

---

## How to Connect Vercel to the Repository

1. **Create a Vercel account** at [vercel.com](https://vercel.com)
2. **Import the repository:**
   - Dashboard → "Add New" → "Project"
   - Select "Import Git Repository"
   - Choose `bahoma31-jpg/codeforge-ide`
3. **Configure project settings:**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Install Command: `npm ci`
   - Output Directory: `.next` (default)
4. **Retrieve IDs:**
   - Project ID + Org ID from Project Settings → General
5. **Generate API token:**
   - Account Settings → Tokens → "Create Token"
   - Copy immediately (shown only once)
6. **Add all values as GitHub Secrets** (see section above)

---

## Running the Same Checks Locally

```bash
# Full CI simulation
npm ci && npm run lint && npx tsc --noEmit && npm run test:run && npm run test:integration && npm run test:coverage && npm run build
```

**Individual checks:**
```bash
npm run lint            # Lint only
npm run lint -- --fix   # Auto-fix lint issues
npx tsc --noEmit        # Type check only
npm run test:run        # Unit tests
npm run test:integration # Integration tests
npm run test:coverage   # Tests with coverage
npm run build           # Build only
```

---

## Troubleshooting Common CI Errors

### Build & Install

| Error | Cause | Solution |
|-------|-------|----------|
| `npm ci` lockfile mismatch | `package-lock.json` out of sync | Run `npm install` locally, commit updated lockfile |
| Peer dependency conflict | Incompatible versions | Add `--legacy-peer-deps` or fix versions |
| Module not found | Missing dependency | Run `npm ci` to ensure clean install |

### TypeScript

| Error | Cause | Solution |
|-------|-------|----------|
| Type errors on `tsc --noEmit` | Type mismatches | Fix types locally, verify with `npx tsc --noEmit` |
| Missing type declarations | `@types/*` not installed | Install required `@types` package |

### Tests

| Error | Cause | Solution |
|-------|-------|----------|
| Test timeouts | Async without cleanup | Add proper teardown; increase timeout |
| Pass locally, fail in CI | Environment diff | Check Node version, env vars, paths |

### Vercel Deploy

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid `VERCEL_TOKEN` | Regenerate in Vercel, update secret |
| Project not found | Wrong `VERCEL_PROJECT_ID` | Verify in Vercel Project Settings |
| Health check fails | App crash or cold start | Check Vercel logs; increase retries |

---

## Files Added in Phase 10

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
