# Contributing to CodeForge IDE

Thank you for your interest in contributing to CodeForge IDE! We welcome contributions from the community.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x (or pnpm >= 8.x)
- Git
- GitHub account

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/codeforge-ide.git
cd codeforge-ide

# Add upstream remote
git remote add upstream https://github.com/bahoma31-jpg/codeforge-ide.git
```

### Install Dependencies

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code
- Follow coding standards
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Check types
npm run type-check

# Format code
npm run format
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Go to GitHub and create a pull request from your fork to the main repository.

---

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use strict mode

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // Implementation
}

// Avoid
function getUser(id: any): any {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components small and focused
- Use proper prop types

```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Hooks: `use-hook-name.ts`
- Types: `types.ts` or inline with component

```
components/
  ├── Button.tsx
  ├── FileTree.tsx
  └── FileTreeItem.tsx

lib/
  ├── git-manager.ts
  ├── file-system.ts
  └── utils.ts

hooks/
  ├── use-editor.ts
  └── use-git.ts
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Use semicolons
- Max line length: 100 characters

```typescript
const config = {
  name: 'codeforge',
  version: '1.0.0',
  features: ['editor', 'git', 'terminal'],
};
```

---

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

### Examples

```
feat(editor): add syntax highlighting for TypeScript

fix(git): resolve merge conflict detection bug

docs: update installation instructions

style: format code with Prettier

refactor(store): extract git operations into separate module

perf(editor): optimize file tree rendering with virtual scrolling

test(git): add unit tests for commit functionality

chore: update dependencies
```

### Commit Best Practices

- Write clear, concise commit messages
- Keep commits focused and atomic
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")

---

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Types are correct (`npm run type-check`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Follows coding standards
```

### Review Process

1. Maintainer reviews your PR
2. Address feedback and make changes
3. Push updates to your branch
4. Once approved, PR will be merged

### After Merge

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Writing Tests

#### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useGitStore } from '@/store/git-store';

describe('Git Store', () => {
  it('commits changes successfully', async () => {
    const { result } = renderHook(() => useGitStore());
    
    await act(async () => {
      await result.current.commit('test commit');
    });
    
    expect(result.current.commits).toHaveLength(1);
    expect(result.current.commits[0].message).toBe('test commit');
  });
});
```

---

## Documentation

### Code Comments

- Comment complex logic
- Explain "why" not "what"
- Keep comments up-to-date
- Use JSDoc for functions

```typescript
/**
 * Commits staged changes to the repository
 * 
 * @param message - The commit message
 * @param options - Optional commit options
 * @returns Promise that resolves to commit SHA
 * @throws Error if no changes are staged
 */
async function commit(
  message: string,
  options?: CommitOptions
): Promise<string> {
  // Implementation
}
```

### README Updates

- Update README.md for new features
- Add usage examples
- Update screenshots if needed

### API Documentation

- Document public APIs
- Include examples
- Specify types and return values

---

## Project Structure

```
codeforge-ide/
├── app/                   # Next.js app directory
├── components/            # React components
│   ├── codeforge/         # Main IDE components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and libraries
│   ├── git/               # Git operations
│   ├── db/                # IndexedDB operations
│   └── utils/             # Helper functions
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── docs/                  # Documentation
├── tests/                 # Test files
└── public/                # Static assets
```

---

## Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our Discord server (coming soon)
- **Email**: contact@codeforge.dev

---

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

Thank you for contributing to CodeForge IDE! 🚀
