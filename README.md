# \uD83D\uDE80 CodeForge IDE

A modern, web-based code editor inspired by VS Code, built with Next.js 14 and TypeScript.

## \u2728 Features (Planned)

- \uD83D\uDCDD **Monaco Editor** \u2014 The same editor that powers VS Code
- \uD83D\uDCC1 **File Management** \u2014 Full CRUD operations with IndexedDB
- \uD83D\uDD17 **GitHub Integration** \u2014 Clone, commit, push, and pull
- \uD83D\uDDA5\uFE0F **Integrated Terminal** \u2014 Run commands directly in the browser
- \uD83C\uDFA8 **Themes** \u2014 Light, Dark, and High Contrast modes
- \u26A1 **Fast & Responsive** \u2014 Built with performance in mind

## \uD83D\uDEE0\uFE0F Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand |
| **Testing** | Vitest + Testing Library |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **Git** | Octokit.js (GitHub REST API) |
| **Deployment** | Vercel |

## \uD83C\uDFD7\uFE0F Project Structure

```
codeforge-ide/
\u251C\u2500\u2500 app/                  # Next.js App Router
\u251C\u2500\u2500 components/           # React components
\u2502   \u251C\u2500\u2500 ui/              # shadcn/ui components
\u2502   \u2514\u2500\u2500 codeforge/       # Custom IDE components
\u2502       \u251C\u2500\u2500 layout/      # Layout components
\u2502       \u251C\u2500\u2500 editor/      # Editor components
\u2502       \u251C\u2500\u2500 file-explorer/ # File tree
\u2502       \u2514\u2500\u2500 terminal/    # Terminal
\u251C\u2500\u2500 lib/                  # Core logic
\u2502   \u251C\u2500\u2500 stores/          # Zustand stores
\u2502   \u251C\u2500\u2500 services/        # Business logic
\u2502   \u251C\u2500\u2500 types/           # TypeScript types
\u2502   \u2514\u2500\u2500 utils/           # Utility functions
\u251C\u2500\u2500 public/               # Static assets
\u2514\u2500\u2500 tests/                # Test files
```

## \uD83D\uDE80 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/bahoma31-jpg/codeforge-ide.git
cd codeforge-ide

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## \uD83D\uDCDD Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests |
| `pnpm test:ui` | Run tests with UI |
| `pnpm test:coverage` | Generate coverage report |

## \uD83E\uDDEA Testing

```bash
pnpm test            # Run all tests
pnpm test:ui         # Run tests with UI
pnpm test:coverage   # Generate coverage
```

## \uD83D\uDCE6 Project Status

**Current Phase:** Infrastructure Setup \u2705

### Milestones

- [x] **M1:** Infrastructure Setup (Week 1-2)
- [ ] **M2:** Editor + File System (Week 3-5)
- [ ] **M3:** Tabs + Search (Week 5-7)
- [ ] **M4:** GitHub Integration (Week 7-10)
- [ ] **M5:** Terminal + Optimizations (Week 10-13)
- [ ] **M6:** Testing + Deployment (Week 13-16)

## \uD83D\uDC65 Agents

| Agent | Role | Status |
|---|---|---|
| Agent 1 | Infrastructure Architect | \u2705 Complete |
| Agent 2 | UI Layout Builder | \u23F3 Next |
| Agent 3 | Monaco Integration Expert | Pending |
| Agent 4 | File System Manager | Pending |
| Agent 5 | GitHub Integration Specialist | Pending |
| Agent 6 | Terminal Emulator Engineer | Pending |
| Agent 7 | Quality Assurance & Testing | Ongoing |

## \uD83D\uDCC4 License

MIT License - see [LICENSE](LICENSE) file for details.

## \uD83D\uDE4F Acknowledgments

- [VS Code](https://code.visualstudio.com/) \u2014 Inspiration
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) \u2014 Code editor engine
- [Next.js](https://nextjs.org/) \u2014 React framework
- [shadcn/ui](https://ui.shadcn.com/) \u2014 UI components
