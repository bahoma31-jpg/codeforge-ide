# 🏗️ Architecture Overview

## نظرة عامة

CodeForge IDE هو تطبيق ويب مبني على **Next.js** مع **React** و **TypeScript**، مصمم ليعمل كمحرر أكواد كامل في المتصفح مع دعم كامل لـ Git والمحطة الطرفية.

---

## 📊 Architecture Layers

### 1. Presentation Layer (طبقة العرض)

```
┌───────────────────────────────────────────────┐
│           React Components (UI Layer)            │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Editor    │  │  Sidebar   │  │  Terminal  │  │
│  │ Component  │  │ Component │  │ Component │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
└───────────────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────┐
│        State Management (Zustand Stores)        │
│                                                   │
│  EditorStore | GitStore | FSStore | TermStore  │
└───────────────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────┐
│             Service Layer (Core Logic)           │
│                                                   │
│    GitService | FSService | GHService | TermSvc  │
└───────────────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────┐
│             Storage Layer (Persistence)          │
│                                                   │
│    IndexedDB | LocalStorage | SessionStorage     │
└───────────────────────────────────────────────┘
```

---

## 💾 Zustand Stores Architecture

### 1. Editor Store

**المسؤولية**: إدارة حالة المحرر والملفات المفتوحة

```typescript
interface EditorStore {
  // State
  files: File[];
  activeFileId: string | null;
  tabs: Tab[];

  // Monaco Editor Instance
  monacoInstance: monaco.editor.IStandaloneCodeEditor | null;

  // Actions
  openFile: (file: File) => void;
  closeFile: (fileId: string) => void;
  saveFile: (fileId: string, content: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  setActiveFile: (fileId: string) => void;

  // Editor Config
  theme: 'light' | 'dark';
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}
```

**تدفق البيانات**:

```
User Action → Editor Component → Editor Store → File System Service → IndexedDB
```

---

### 2. Git Store

**المسؤولية**: إدارة عمليات Git والمستودعات

```typescript
interface GitStore {
  // State
  repository: Repository | null;
  currentBranch: string;
  branches: string[];
  commits: Commit[];
  status: FileStatus[];

  // GitHub
  githubToken: string | null;
  githubUser: GitHubUser | null;
  repositories: GitHubRepo[];

  // Actions
  init: (path: string) => Promise<void>;
  clone: (url: string, path: string) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  createBranch: (name: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  merge: (branch: string) => Promise<void>;

  // Status
  getStatus: () => Promise<FileStatus[]>;
  stage: (files: string[]) => Promise<void>;
  unstage: (files: string[]) => Promise<void>;
}
```

**تدفق البيانات**:

```
Git Command → Git Store → Git Service (isomorphic-git) → IndexedDB/GitHub API
```

---

### 3. File System Store

**المسؤولية**: إدارة نظام الملفات المحلي

```typescript
interface FileSystemStore {
  // State
  tree: FileNode[];
  currentPath: string;

  // Actions
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  createFile: (path: string) => Promise<void>;
  createFolder: (path: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  copy: (source: string, destination: string) => Promise<void>;

  // Tree Operations
  loadTree: (path: string) => Promise<void>;
  expandFolder: (path: string) => void;
  collapseFolder: (path: string) => void;
}
```

**بنية FileNode**:

```typescript
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isExpanded?: boolean;
  size?: number;
  modifiedAt?: Date;
}
```

---

### 4. Terminal Store

**المسؤولية**: إدارة المحطات الطرفية

```typescript
interface TerminalStore {
  // State
  terminals: Terminal[];
  activeTerminalId: string | null;

  // Actions
  createTerminal: () => string;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  executeCommand: (id: string, command: string) => Promise<string>;

  // Command History
  history: string[];
  historyIndex: number;
}

interface Terminal {
  id: string;
  name: string;
  cwd: string; // Current Working Directory
  xterm: XTerm.Terminal;
  history: CommandHistory[];
}
```

---

## 🔧 Git Layer Architecture

### isomorphic-git Integration

```
┌─────────────────────────────────────────────┐
│             UI Layer (React Components)           │
│                                                     │
│    Git Panel | Commit Form | Branch Switcher      │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│           Store Layer (Zustand Git Store)         │
│                                                     │
│    State Management + Action Dispatching          │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│        Service Layer (GitService wrapper)          │
│                                                     │
│   • Authentication handling                       │
│   • Error handling                                │
│   • Progress tracking                             │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│            isomorphic-git Core Library             │
│                                                     │
│   commit | push | pull | merge | checkout | ...   │
└─────────────────────────────────────────────┘
             ↓                      ↓
   ┌───────────────┐    ┌───────────────┐
   │   IndexedDB    │    │  GitHub API   │
   │ (LightningFS) │    │ (Remote Ops) │
   └───────────────┘    └───────────────┘
```

### عمليات Git المدعومة

| Operation  | Description        | Local | Remote |
| ---------- | ------------------ | ----- | ------ |
| `init`     | إنشاء مستودع جديد  | ✅    | -      |
| `clone`    | استنساخ مستودع     | ✅    | ✅     |
| `add`      | إضافة للمرحلة      | ✅    | -      |
| `commit`   | حفظ التغييرات      | ✅    | -      |
| `push`     | رفع إلى GitHub     | ✅    | ✅     |
| `pull`     | جلب من GitHub      | ✅    | ✅     |
| `fetch`    | جلب المراجع        | ✅    | ✅     |
| `merge`    | دمج الفروع         | ✅    | -      |
| `branch`   | إدارة الفروع       | ✅    | -      |
| `checkout` | التبديل بين الفروع | ✅    | -      |
| `status`   | حالة الملفات       | ✅    | -      |
| `log`      | سجل العمليات       | ✅    | -      |

---

## 🎭 Component Hierarchy

### البنية الهرمية للمكونات

```
App (Root)
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── MenuBar
│   │   └── UserProfile
│   │
│   ├── MainContainer
│   │   ├── Sidebar
│   │   │   ├── FileExplorer
│   │   │   │   ├── FileTree
│   │   │   │   │   ├── FolderNode
│   │   │   │   │   └── FileNode
│   │   │   │   └── FileActions
│   │   │   │
│   │   │   ├── SourceControl
│   │   │   │   ├── GitPanel
│   │   │   │   ├── ChangesView
│   │   │   │   ├── CommitForm
│   │   │   │   └── BranchSwitcher
│   │   │   │
│   │   │   └── Search
│   │   │
│   │   ├── Editor
│   │   │   ├── TabBar
│   │   │   │   └── Tab (multiple)
│   │   │   │
│   │   │   ├── MonacoEditor
│   │   │   │
│   │   │   └── StatusBar
│   │   │       ├── FileInfo
│   │   │       ├── GitBranch
│   │   │       └── EditorSettings
│   │   │
│   │   └── Panel (Bottom)
│   │       ├── Terminal
│   │       │   ├── TerminalTabs
│   │       │   └── XTermContainer
│   │       │
│   │       ├── Problems
│   │       ├── Output
│   │       └── DebugConsole
│   │
│   └── Modals
│       ├── WelcomeScreen
│       ├── KeyboardShortcuts
│       ├── Settings
│       └── GitHubLogin
│
└── Providers
    ├── ThemeProvider
    ├── AuthProvider
    └── ToastProvider
```

---

## 📊 Data Flow Diagrams

### 1. File Save Flow

```
User edits file in Monaco Editor
            ↓
  onChange event triggered
            ↓
  EditorStore.updateFileContent()
            ↓
  User presses Ctrl+S
            ↓
  EditorStore.saveFile()
            ↓
  FileSystemService.writeFile()
            ↓
  IndexedDB saves content
            ↓
  GitStore.getStatus() (auto-refresh)
            ↓
  UI shows "Modified" indicator
```

### 2. Git Commit Flow

```
User modifies file
            ↓
  GitStore.getStatus()
            ↓
  Shows changed files in Git Panel
            ↓
  User stages files
            ↓
  GitStore.stage(files)
            ↓
  User writes commit message
            ↓
  GitStore.commit(message)
            ↓
  isomorphic-git creates commit
            ↓
  Commit saved to IndexedDB
            ↓
  UI shows success notification
            ↓
  User pushes to GitHub
            ↓
  GitStore.push()
            ↓
  isomorphic-git pushes via GitHub API
```

### 3. GitHub OAuth Flow

```
User clicks "Sign in with GitHub"
            ↓
  Redirect to GitHub OAuth
            ↓
  User authorizes app
            ↓
  GitHub redirects back with code
            ↓
  NextAuth exchanges code for token
            ↓
  Token saved in SessionStorage
            ↓
  GitStore.setGitHubToken(token)
            ↓
  GitStore.fetchRepositories()
            ↓
  UI shows user's repositories
```

---

## 💻 Technology Stack Details

### Frontend Framework

- **Next.js 15**: App Router, Server Components
- **React 19**: Concurrent Features, Suspense
- **TypeScript 5**: Strict Mode, Path Aliases

### Editor & Terminal

- **Monaco Editor**: Full VS Code editor in browser
- **xterm.js**: Terminal emulator with full ANSI support
- **@xterm/addon-fit**: Terminal auto-resize
- **@xterm/addon-web-links**: Clickable URLs

### UI Components

- **shadcn/ui**: Radix UI + Tailwind CSS
- **Lucide Icons**: Modern icon library
- **Tailwind CSS**: Utility-first CSS

### State Management

- **Zustand**: Lightweight state management
- **Immer**: Immutable state updates

### Git Integration

- **isomorphic-git**: Pure JavaScript Git
- **LightningFS**: IndexedDB file system
- **GitHub API**: REST API v3

### Storage

- **IndexedDB**: File content storage
- **LocalStorage**: User preferences
- **SessionStorage**: Auth tokens

---

## 🔒 Security Architecture

### Authentication

- GitHub OAuth 2.0
- JWT tokens in SessionStorage
- Token refresh mechanism

### Data Protection

- All data stored locally (IndexedDB)
- No server-side file storage
- GitHub tokens never exposed in URLs

### XSS Prevention

- React auto-escaping
- Content Security Policy headers
- Sanitized terminal output

---

## 🚀 Performance Optimizations

### Code Splitting

```typescript
// Dynamic imports for heavy components
const Monaco = dynamic(() => import('@monaco-editor/react'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});

const Terminal = dynamic(() => import('./terminal'), {
  loading: () => <TerminalSkeleton />,
  ssr: false
});
```

### Virtualization

- File tree virtualization for large projects
- Terminal line virtualization

### Memoization

```typescript
const FileNode = memo(
  ({ node }: Props) => {
    // Component logic
  },
  (prev, next) => prev.node.id === next.node.id
);
```

### Web Workers

- Git operations in Web Worker
- File parsing in Web Worker

---

## 📝 Notes

### القيود الحالية

1. **Browser Limitations**: لا يمكن تشغيل عمليات مثل `npm install` في المتصفح
2. **Large Files**: ملفات أكبر من 100MB قد تسبب مشاكل في الأداء
3. **Git LFS**: غير مدعوم حاليًا
4. **Binary Files**: دعم محدود للملفات الثنائية

### التحسينات المستقبلية

1. **WebContainers**: تشغيل Node.js في المتصفح
2. **Live Share**: تعاون فوري بين المطورين
3. **AI Assistant**: مساعد AI للبرمجة
4. **Cloud Sync**: مزامنة سحابية

---

📚 **للمزيد من المعلومات**: [Git Integration Guide](./git-integration.md)
