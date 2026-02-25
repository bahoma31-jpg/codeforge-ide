# 🏗️ CodeForge IDE - Architecture Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Hierarchy](#component-hierarchy)
3. [State Management](#state-management)
4. [Git Layer Architecture](#git-layer-architecture)
5. [File System Layer](#file-system-layer)
6. [Data Flow](#data-flow)
7. [Performance Optimizations](#performance-optimizations)

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Components (Next.js 15 + App Router)                  │  │
│  │  - Editor Area (Monaco)                                      │  │
│  │  - File Explorer                                             │  │
│  │  - Source Control Panel                                      │  │
│  │  - Terminal Panel                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌────────────────────────────────────────────────────────────────────┐
│                         State Layer (Zustand)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  editorStore | filesStore | gitStore | terminalStore | uiStore │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌────────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                         │
│  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │  Git Manager   │  │  File Manager    │  │  Terminal Mgr  │  │
│  │  (isomorphic)  │  │  (IndexedDB)     │  │  (xterm.js)    │  │
│  └────────────────┘  └───────────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌────────────────────────────────────────────────────────────────────┐
│                          Data Layer                               │
│  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │  IndexedDB     │  │  Lightning FS    │  │  GitHub API    │  │
│  │  (Files)       │  │  (Git Objects)   │  │  (OAuth)       │  │
│  └────────────────┘  └───────────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Main Layout Structure

```
app/
└── page.tsx (Root)
    │
    └── MainLayout (Dynamic Import)
        ├── ActivityBar
        │   ├── ExplorerIcon
        │   ├── SearchIcon
        │   ├── SourceControlIcon
        │   └── SettingsIcon
        │
        ├── Sidebar (Conditional)
        │   ├── FileExplorer
        │   │   ├── FileTree (Virtual Scrolling)
        │   │   └── FileTreeItem (Memoized)
        │   │
        │   └── SourceControl
        │       ├── ChangesList
        │       ├── CommitForm
        │       └── GitHistoryPanel
        │
        ├── EditorArea
        │   ├── TabBar
        │   │   └── EditorTab (Multiple)
        │   │
        │   └── MonacoEditor (Lazy Loaded)
        │
        └── BottomPanel (Conditional)
            └── TerminalPanel (Lazy Loaded)
                ├── TerminalTabs
                └── XtermTerminal
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **MainLayout** | Layout orchestration, code splitting |
| **ActivityBar** | Primary navigation, view switching |
| **FileExplorer** | File tree display, folder navigation |
| **FileTree** | Virtualized file list rendering |
| **SourceControl** | Git status, staging, commit UI |
| **EditorArea** | Tab management, editor orchestration |
| **MonacoEditor** | Code editing, IntelliSense |
| **TerminalPanel** | Terminal tabs, xterm.js integration |

---

## State Management

### Zustand Stores Architecture

#### 1. **Editor Store** (`store/editor-store.ts`)

```typescript
interface EditorState {
  // State
  openTabs: EditorTab[];
  activeTabId: string | null;
  
  // Actions
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
}
```

**Responsibilities:**
- Open/close tabs
- Track active editor
- Manage editor content
- Handle unsaved changes

#### 2. **Files Store** (`store/files-store.ts`)

```typescript
interface FilesState {
  // State
  files: FileNode[];
  selectedFile: string | null;
  
  // Actions
  loadFiles: () => Promise<void>;
  createFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
}
```

**Responsibilities:**
- File CRUD operations
- File tree state
- IndexedDB synchronization

#### 3. **Git Store** (`store/git-store.ts`)

```typescript
interface GitState {
  // State
  currentBranch: string | null;
  changedFiles: GitChange[];
  commits: GitCommit[];
  
  // Actions
  initRepo: () => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
}
```

**Responsibilities:**
- Git operations
- Branch management
- Commit history
- Remote synchronization

#### 4. **Terminal Store** (`store/terminal-store.ts`)

```typescript
interface TerminalState {
  // State
  terminals: Terminal[];
  activeTerminalId: string | null;
  
  // Actions
  createTerminal: () => void;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  executeCommand: (id: string, command: string) => void;
}
```

**Responsibilities:**
- Terminal lifecycle
- Command execution
- Output buffering

#### 5. **UI Store** (`store/ui-store.ts`)

```typescript
interface UIState {
  // State
  sidebarVisible: boolean;
  panelVisible: boolean;
  activeView: 'explorer' | 'source-control' | 'search';
  theme: 'light' | 'dark';
  
  // Actions
  toggleSidebar: () => void;
  togglePanel: () => void;
  setActiveView: (view: string) => void;
  setTheme: (theme: string) => void;
}
```

**Responsibilities:**
- UI visibility state
- Theme management
- Layout preferences

---

## Git Layer Architecture

### Git Engine Stack

```
┌─────────────────────────────────────────────────────┐
│                   Git Store (State)                      │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│             Git Manager (lib/git/)                      │
│  - git-manager.ts (High-level operations)               │
│  - git-operations.ts (Low-level Git commands)           │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │isomorphic│  │Lightning │  │ GitHub  │
  │   -git   │  │    FS    │  │   API   │
  └──────────┘  └──────────┘  └──────────┘
  (Git Ops)   (Storage)   (Remote)
```

### Git Operations Flow

**Example: Commit Flow**

```
User clicks "Commit"
    │
    ↓
 CommitForm component
    │
    ↓
 gitStore.commit(message)
    │
    ↓
 GitManager.commit()
    │
    ↓
 isomorphic-git.commit()
    │
    ↓
 Lightning FS (IndexedDB)
    │
    ↓
Commit object stored
    │
    ↓
State updated (commits array)
    │
    ↓
UI re-renders
```

---

## File System Layer

### IndexedDB Schema

```typescript
// Database: codeforge-db

interface FilesTable {
  id: string;          // Primary key (file path)
  name: string;        // File name
  path: string;        // Full path
  content: string;     // File content
  type: 'file' | 'folder';
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface GitObjectsTable {
  oid: string;         // Primary key (Git object ID)
  type: 'commit' | 'tree' | 'blob' | 'tag';
  object: Uint8Array;  // Git object data
}

interface GitRefsTable {
  ref: string;         // Primary key (refs/heads/main)
  oid: string;         // Commit SHA
}
```

### File Operations Flow

**Example: Save File**

```
Monaco Editor onChange
    │
    ↓
editorStore.updateTabContent()
    │
    ↓
Debouce (500ms)
    │
    ↓
filesStore.saveFile()
    │
    ↓
IndexedDB.put()
    │
    ↓
File saved to database
    │
    ↓
gitStore.detectChanges()
    │
    ↓
Git status updated
```

---

## Data Flow

### User Action Flow

```
User Interaction (UI Event)
    │
    ↓
Component Event Handler
    │
    ↓
Store Action (Zustand)
    │
    ↓
Business Logic Layer
    ├── File Manager
    ├── Git Manager
    └── Terminal Manager
    │
    ↓
Data Layer (IndexedDB / API)
    │
    ↓
State Update (Zustand)
    │
    ↓
Component Re-render (React)
    │
    ↓
UI Update
```

### Cross-Store Communication

```typescript
// Example: File save triggers Git detection

// In filesStore
export const filesStore = create<FilesState>((set, get) => ({
  saveFile: async (path: string, content: string) => {
    // Save to IndexedDB
    await saveToIndexedDB(path, content);
    
    // Update state
    set((state) => ({ /* ... */ }));
    
    // Notify Git store
    gitStore.getState().detectChanges();
  },
}));
```

---

## Performance Optimizations

### 1. **Code Splitting**

```typescript
// Heavy components loaded on demand
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

const TerminalPanel = dynamic(
  () => import('./terminal-panel'),
  { ssr: false, loading: () => <TerminalSkeleton /> }
);
```

### 2. **Virtual Scrolling**

```typescript
// File tree with 10,000+ files
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={files.length}
  itemSize={28}
  width="100%"
>
  {({ index, style }) => (
    <FileTreeItem file={files[index]} style={style} />
  )}
</FixedSizeList>
```

### 3. **Memoization**

```typescript
// Prevent unnecessary re-renders
export default React.memo(FileTreeItem, (prev, next) => {
  return prev.file.id === next.file.id &&
         prev.file.updatedAt === next.file.updatedAt;
});

// Expensive computations
const sortedFiles = useMemo(() => {
  return files.sort((a, b) => a.name.localeCompare(b.name));
}, [files]);
```

### 4. **IndexedDB Batching**

```typescript
// Before: N operations
for (const file of files) {
  await db.files.put(file);
}

// After: 1 transaction
await db.transaction('rw', db.files, async () => {
  await db.files.bulkPut(files);
});
```

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5.x |
| **State Management** | Zustand |
| **Code Editor** | Monaco Editor |
| **Git Engine** | isomorphic-git |
| **File System** | Lightning FS |
| **Database** | IndexedDB (Dexie.js) |
| **Terminal** | xterm.js |
| **Styling** | Tailwind CSS 4.0 |
| **Components** | shadcn/ui |
| **Authentication** | NextAuth.js |

---

## Security Considerations

### 1. **GitHub OAuth**
- Tokens stored in HTTP-only cookies
- No token exposure to client-side JavaScript
- CSRF protection via NextAuth

### 2. **IndexedDB**
- Data isolated per origin
- No cross-origin access
- Encrypted at rest by browser

### 3. **Content Security Policy**
- Restrict inline scripts
- Whitelist trusted domains
- Prevent XSS attacks

---

## Scalability Considerations

### Current Limits
- **Files per repository**: ~10,000 (virtual scrolling handles this)
- **File size**: ~10MB (Monaco Editor limit)
- **IndexedDB storage**: ~50GB (browser-dependent)
- **Git objects**: Unlimited (Lightning FS manages)

### Future Improvements
- Web Workers for Git operations
- Streaming large file content
- Incremental loading of commit history
- Service Worker for offline support

---

**Last Updated**: Phase 8 (February 2026)
