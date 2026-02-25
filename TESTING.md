# Testing Guide - CodeForge IDE

## Overview

This document outlines the testing infrastructure for CodeForge IDE. We use **Vitest** as our testing framework with comprehensive coverage requirements.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Test Structure

### Directory Organization

```
codeforge-ide/
├── lib/
│   ├── stores/
│   │   └── __tests__/          # Store unit tests
│   │       ├── editor-store.test.ts
│   │       ├── files-store.test.ts
│   │       ├── git-store.test.ts
│   │       ├── ui-store.test.ts
│   │       └── terminal-store.test.ts
│   └── git/
│       └── __tests__/          # Git operations tests
│           ├── operations.test.ts
│           ├── diff.test.ts
│           ├── merge.test.ts
│           └── status.test.ts
├── components/
│   └── codeforge/
│       └── __tests__/          # Component tests
│           ├── source-control/
│           │   ├── changes-list.test.tsx
│           │   └── commit-section.test.tsx
│           └── terminal/
│               └── terminal-panel.test.tsx
└── __tests__/
    └── integration/            # Integration tests
        ├── git-workflow.test.ts
        ├── terminal-operations.test.ts
        └── file-system.test.ts
```

### Test Categories

#### 1. Unit Tests

**Location**: Next to source files in `__tests__` folders

**Purpose**: Test individual functions, methods, and components in isolation

**Coverage Target**: ≥ 80%

#### 2. Integration Tests

**Location**: `__tests__/integration/`

**Purpose**: Test interaction between multiple modules

**Coverage Target**: ≥ 75%

#### 3. Component Tests

**Location**: `components/*/__tests__/`

**Purpose**: Test React components with user interactions

**Coverage Target**: ≥ 70%

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Targeted Test Runs

```bash
# Run only store tests
npm run test:stores

# Run only git operations tests
npm run test:git

# Run only component tests
npm run test:components

# Run only integration tests
npm run test:integration
```

### Running Specific Test Files

```bash
# Run specific test file
vitest run lib/stores/__tests__/editor-store.test.ts

# Run tests matching a pattern
vitest run --grep="openFile"

# Run tests in a specific directory
vitest run lib/stores/__tests__/
```

## Coverage Requirements

### Overall Thresholds

| Metric       | Threshold | Category      |
| ------------ | --------- | ------------- |
| Lines        | 80%       | Stores        |
| Functions    | 80%       | Stores        |
| Branches     | 75%       | Stores        |
| Statements   | 80%       | Stores        |
| Lines        | 75%       | Git Ops       |
| Functions    | 75%       | Git Ops       |
| Lines        | 70%       | Components    |
| Functions    | 70%       | Components    |

### Viewing Coverage Reports

After running `npm run test:coverage`, reports are generated in:

- **Terminal**: Text summary
- **HTML**: `coverage/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI tools)
- **JSON**: `coverage/coverage-final.json`

```bash
# Generate and open HTML coverage report
npm run test:coverage
open coverage/index.html  # macOS
# or
start coverage/index.html # Windows
```

## Writing Tests

### Store Tests Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/lib/stores/editor-store';

describe('editor-store', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useEditorStore.getState();
    store.openFiles = [];
    store.activeFile = null;
  });

  describe('openFile', () => {
    it('should add file to openFiles', () => {
      const { openFile, openFiles } = useEditorStore.getState();
      
      openFile('test.ts');
      
      expect(openFiles).toContain('test.ts');
    });

    it('should set file as active', () => {
      const { openFile, activeFile } = useEditorStore.getState();
      
      openFile('test.ts');
      
      expect(activeFile).toBe('test.ts');
    });

    it('should not duplicate files', () => {
      const { openFile, openFiles } = useEditorStore.getState();
      
      openFile('test.ts');
      openFile('test.ts');
      
      expect(openFiles.filter(f => f === 'test.ts')).toHaveLength(1);
    });
  });
});
```

### Component Tests Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangesList } from '@/components/codeforge/source-control/changes-list';

describe('ChangesList', () => {
  it('should render changes list', () => {
    const changes = [
      { path: 'file1.ts', status: 'modified' },
      { path: 'file2.ts', status: 'added' },
    ];

    render(<ChangesList changes={changes} />);

    expect(screen.getByText('file1.ts')).toBeInTheDocument();
    expect(screen.getByText('file2.ts')).toBeInTheDocument();
  });

  it('should handle file click', () => {
    const onFileClick = vi.fn();
    const changes = [{ path: 'test.ts', status: 'modified' }];

    render(<ChangesList changes={changes} onFileClick={onFileClick} />);

    fireEvent.click(screen.getByText('test.ts'));

    expect(onFileClick).toHaveBeenCalledWith('test.ts');
  });
});
```

### Integration Tests Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useFilesStore } from '@/lib/stores/files-store';
import { useGitStore } from '@/lib/stores/git-store';

describe('Git Workflow Integration', () => {
  beforeEach(() => {
    useFilesStore.getState().reset?.();
    useGitStore.getState().reset?.();
  });

  it('should complete full git workflow', async () => {
    const filesStore = useFilesStore.getState();
    const gitStore = useGitStore.getState();

    // Initialize repository
    await gitStore.initRepository('/test');

    // Create and modify files
    filesStore.createFile('test.ts', 'content');

    // Stage and commit
    await gitStore.stageFile('test.ts');
    await gitStore.commit('feat: add test file');

    // Verify
    const history = await gitStore.getCommitHistory();
    expect(history[0].message).toBe('feat: add test file');
  });
});
```

## Best Practices

### 1. Test Naming

✅ **Good**:
```typescript
it('should add file to openFiles when openFile is called', () => {});
it('should not duplicate files in openFiles', () => {});
it('should handle closing last file gracefully', () => {});
```

❌ **Bad**:
```typescript
it('test 1', () => {});
it('works', () => {});
it('openFile', () => {});
```

### 2. Test Structure (AAA Pattern)

```typescript
it('should do something', () => {
  // Arrange: Set up test data
  const initialState = { count: 0 };
  
  // Act: Perform the action
  const result = increment(initialState);
  
  // Assert: Verify the result
  expect(result.count).toBe(1);
});
```

### 3. Test Independence

```typescript
// ✅ Good: Each test is independent
beforeEach(() => {
  // Reset state before each test
  useEditorStore.getState().reset?.();
});

// ❌ Bad: Tests depend on execution order
let sharedState;
it('test 1', () => {
  sharedState = 'value';
});
it('test 2', () => {
  expect(sharedState).toBe('value'); // Depends on test 1
});
```

### 4. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: 'mocked' }),
  })
);

// Mock local storage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

### 5. Test Edge Cases

```typescript
describe('closeFile', () => {
  it('should handle normal case', () => {});
  it('should handle closing active file', () => {});
  it('should handle closing last file', () => {});
  it('should handle closing non-existent file', () => {});
  it('should handle empty openFiles array', () => {});
});
```

### 6. Async Testing

```typescript
// ✅ Good: Properly handle async
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// ✅ Good: Test loading states
it('should show loading state', async () => {
  const promise = fetchData();
  expect(store.loading).toBe(true);
  await promise;
  expect(store.loading).toBe(false);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:ci
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
npm run test:run
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // ...
}, 10000); // 10 seconds
```

#### 2. Memory Leaks in Tests

```typescript
afterEach(() => {
  // Clean up subscriptions, timers, etc.
  cleanup();
});
```

#### 3. Mock Not Working

```typescript
// Clear mock between tests
afterEach(() => {
  vi.clearAllMocks();
});
```

#### 4. Coverage Not Updating

```bash
# Clear coverage cache
rm -rf coverage/
npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Zustand Testing Guide](https://docs.pmnd.rs/zustand/guides/testing)

## Contributing

When adding new features:

1. ✅ Write tests first (TDD)
2. ✅ Ensure all tests pass
3. ✅ Maintain coverage thresholds
4. ✅ Follow naming conventions
5. ✅ Add integration tests for workflows

---

**Questions?** Open an issue or reach out to the maintainers.
