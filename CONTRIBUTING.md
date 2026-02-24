# Contributing to CodeForge IDE

Thank you for your interest in contributing! \uD83C\uDF89

## Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run linter (`pnpm lint:fix`)
6. Format code (`pnpm format`)
7. Commit your changes (`git commit -m 'feat: add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Code Standards

- Write TypeScript (no `any` types without good reason)
- Follow ESLint rules
- Format with Prettier
- Write tests for new features
- Keep components small and focused
- Document complex logic with comments

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

**Example:** `feat: add file drag and drop support`

## Project Architecture

```
components/codeforge/  \u2192 IDE UI components
lib/stores/            \u2192 Zustand state management
lib/services/          \u2192 Business logic & API calls
lib/types/             \u2192 TypeScript type definitions
lib/utils/             \u2192 Shared utility functions
tests/                 \u2192 Test files
```

## Questions?

Open an issue or reach out to the team. We're happy to help!
