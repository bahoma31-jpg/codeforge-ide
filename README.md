# 🔥 CodeForge IDE

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<div align="center">
  <h3>A Modern, Full-Featured Web-Based Code Editor</h3>
  <p>Built with Next.js, Monaco Editor, and powered by IndexedDB</p>
</div>

---

## 🌟 Features

### 💻 **Full-Featured Code Editor**
- 🎨 **Monaco Editor** integration (VS Code's editor engine)
- 🎯 IntelliSense and auto-completion
- 🔍 Multi-cursor editing
- 🎨 Syntax highlighting for 50+ languages
- 📝 Code formatting and linting
- 🔧 Customizable themes (Light, Dark, High Contrast)

### 🔗 **GitHub Integration**
- 🔐 OAuth authentication
- 📂 Browse and clone repositories
- 🌿 Branch management (create, switch, delete)
- 👀 View commit history
- 🔄 Sync with remote repositories
- 📊 View GitHub profile and organizations

### 🗂️ **Git Operations (Local)**
- ✅ Stage and commit changes
- 📤 Push to remote
- 📥 Pull from remote
- 🔀 Merge branches
- 🔄 Rebase operations
- 🏷️ Tag management
- 📜 Full commit history
- ⚠️ Conflict resolution UI

### 💾 **Local File System**
- 📁 IndexedDB-based file storage
- 🌲 File tree explorer
- 📝 Multi-file tabs
- 🔍 File search
- ✂️ Cut, copy, paste operations
- 🗑️ Delete with confirmation
- 📄 Context menus

### 🖥️ **Integrated Terminal**
- 💻 xterm.js-powered terminal
- 🎨 Multiple terminal instances
- 🔧 Git commands support
- 📝 Command history
- 🎨 Customizable appearance

### ⚡ **Performance Optimized**
- 🚀 Code splitting and lazy loading
- 📦 Bundle size < 200KB (gzipped)
- ♻️ React.memo and useMemo optimizations
- 📜 Virtual scrolling for large file lists
- 💾 IndexedDB batch operations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **pnpm** ≥ 8.x)

### Installation

```bash
# Clone the repository
git clone https://github.com/bahoma31-jpg/codeforge-ide.git

# Navigate to project directory
cd codeforge-ide

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GitHub OAuth credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

---

## 📖 Documentation

- 📐 **[Architecture Overview](docs/architecture.md)** - System design and component structure
- 🔗 **[Git Integration Guide](docs/git-integration.md)** - GitHub OAuth and Git operations
- 💻 **[Terminal Commands](docs/terminal-commands.md)** - Supported terminal commands
- ⌨️ **[Keyboard Shortcuts](docs/keyboard-shortcuts.md)** - Complete shortcuts reference
- 🤝 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Monaco    │  │  File Tree   │  │   Terminal     │ │
│  │   Editor    │  │   Explorer   │  │   (xterm.js)   │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Zustand State Management                │ │
│  │  (Editor, Files, Git, Terminal, UI Stores)          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │  IndexedDB   │  │  GitHub    │  │  isomorphic-git  │ │
│  │  (Files/Git) │  │  OAuth API │  │  (Git Engine)    │ │
│  └──────────────┘  └────────────┘  └──────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Git**: isomorphic-git + Lightning FS
- **Terminal**: xterm.js + xterm-addon-fit
- **State**: Zustand
- **Database**: IndexedDB (Dexie.js)
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js (GitHub OAuth)

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Test Coverage Goals

- Unit Tests: ≥ 80%
- Integration Tests: ≥ 70%
- E2E Tests: Critical user flows

---

## 📊 Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Initial Bundle Size | < 200KB (gzipped) | ✅ Achieved |
| Largest Chunk | < 500KB | ✅ Achieved |
| First Contentful Paint | < 1.5s | ✅ Optimized |
| Time to Interactive | < 3s | ✅ Optimized |
| Lighthouse Score | ≥ 90 | 🎯 Target |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or updates
- `chore:` Build process or tooling changes

---

## 🗺️ Roadmap

### Phase 1-7: ✅ Completed
- [x] Core editor functionality
- [x] File system and explorer
- [x] GitHub OAuth integration
- [x] Git operations (commit, push, pull, merge)
- [x] Integrated terminal
- [x] Testing infrastructure
- [x] Performance optimization

### Phase 8: 🚧 In Progress
- [ ] Comprehensive documentation
- [ ] Keyboard shortcuts panel
- [ ] Welcome screen
- [ ] User onboarding

### Phase 9: 📋 Planned
- [ ] CI/CD pipeline
- [ ] Deployment to Vercel
- [ ] Production monitoring

### Future Features
- [ ] Collaborative editing (WebRTC)
- [ ] Extensions marketplace
- [ ] Diff viewer
- [ ] Code snippets library
- [ ] Remote SSH connections

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The code editor that powers VS Code
- [isomorphic-git](https://isomorphic-git.org/) - Pure JavaScript Git implementation
- [xterm.js](https://xtermjs.org/) - Terminal emulator for the web
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Next.js](https://nextjs.org/) - The React framework for production

---

## 📧 Contact

- **Author**: bahoma31-jpg
- **GitHub**: [@bahoma31-jpg](https://github.com/bahoma31-jpg)
- **Project Link**: [CodeForge IDE](https://github.com/bahoma31-jpg/codeforge-ide)

---

<div align="center">
  <p>Made with ❤️ by the CodeForge team</p>
  <p>⭐ Star us on GitHub if you find this project useful!</p>
</div>
