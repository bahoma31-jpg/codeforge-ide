import { create } from 'zustand';
import {
  getLanguageFromExtension,
  getExtension,
  getFileName,
} from '@/lib/utils/file-path-detect';
import { useAuthStore } from './auth-store';

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  /** Current loaded repo info (for sidebar tree) */
  currentRepo: { owner: string; repo: string; branch: string } | null;
  repoTree: RepoFileNode[];
  repoTreeLoading: boolean;

  addTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  openFile: (file: {
    id: string;
    name: string;
    content: string;
    language?: string;
    path: string;
  }) => void;

  /**
   * Open a file from a path (e.g., clicked in chat).
   * Fetches content from GitHub API if a GitHub token is configured,
   * otherwise opens a placeholder tab.
   */
  openFileFromPath: (filePath: string, language?: string) => Promise<void>;

  /**
   * Load a GitHub repository's file tree into the sidebar.
   * Fetches the root directory listing and stores it for the file tree component.
   */
  loadRepoTree: (owner: string, repo: string, branch?: string) => Promise<void>;

  /**
   * Load children of a directory in the repo tree (lazy loading).
   */
  loadRepoTreeChildren: (path: string) => Promise<void>;

  /**
   * Open a file from the repo tree — fetches content from GitHub and opens in editor.
   */
  openRepoFile: (path: string, name: string) => Promise<void>;
}

/** Represents a file/directory node from GitHub API */
export interface RepoFileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  children?: RepoFileNode[];
  childrenLoaded?: boolean;
}

/**
 * Get GitHub token from the single source of truth: auth-store.
 * Never reads from localStorage or any other location.
 */
function getGitHubToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Fetch file content from GitHub API.
 * Uses token exclusively from auth-store.
 */
async function fetchFileFromGitHub(
  filePath: string
): Promise<{ content: string; found: boolean }> {
  try {
    const token = getGitHubToken();
    if (!token) return { content: '', found: false };

    const storeState = useEditorStore.getState();
    if (!storeState.currentRepo) return { content: '', found: false };

    const { owner, repo, branch } = storeState.currentRepo;
    const cleanPath = filePath.replace(/^\/+/, '');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return { content: '', found: false };

    const data = await response.json();

    if (data.content && data.encoding === 'base64') {
      const decoded = decodeURIComponent(
        escape(atob(data.content.replace(/\n/g, '')))
      );
      return { content: decoded, found: true };
    }

    return { content: '', found: false };
  } catch (error) {
    console.error('[EditorStore] Failed to fetch from GitHub:', error);
    return { content: '', found: false };
  }
}

/** Fetch directory listing from GitHub API */
async function fetchGitHubDirectory(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token: string
): Promise<RepoFileNode[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  const items = await response.json();
  if (!Array.isArray(items)) return [];

  return items
    .map((item: Record<string, unknown>) => ({
      name: item.name as string,
      path: item.path as string,
      type: (item.type === 'dir' ? 'dir' : 'file') as 'file' | 'dir',
      size: (item.size as number) || 0,
      children: item.type === 'dir' ? [] : undefined,
      childrenLoaded: false,
    }))
    .sort((a: RepoFileNode, b: RepoFileNode) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  currentRepo: null,
  repoTree: [],
  repoTreeLoading: false,

  addTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.filePath === tab.filePath);
      if (exists) {
        return { activeTabId: exists.id };
      }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id };
    }),

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? (newTabs[0]?.id ?? null)
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    })),

  openFile: (file) => {
    const tab: EditorTab = {
      id: file.id,
      filePath: file.path,
      fileName: file.name,
      language: file.language || 'plaintext',
      content: file.content,
      isDirty: false,
      isActive: true,
    };

    set((state) => {
      const exists = state.tabs.find((t) => t.id === file.id);
      if (exists) {
        return { activeTabId: exists.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    });
  },

  openFileFromPath: async (filePath: string, language?: string) => {
    const state = get();
    const cleanPath = filePath.replace(/^\/+/, '');

    const existingTab = state.tabs.find(
      (t) => t.filePath === cleanPath || t.filePath === '/' + cleanPath
    );
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const ext = getExtension(cleanPath);
    const lang = language || getLanguageFromExtension(ext);
    const fileName = getFileName(cleanPath);
    const tabId = `file-${cleanPath}-${Date.now()}`;

    const { content, found } = await fetchFileFromGitHub(cleanPath);

    const tab: EditorTab = {
      id: tabId,
      filePath: cleanPath,
      fileName,
      language: lang,
      content: found
        ? content
        : `// ⏳ لم يتم العثور على محتوى الملف: ${cleanPath}\n// تأكد من تسجيل الدخول وإعداد بيانات المستودع\n// أو قم بتعديل المحتوى يدوياً هنا\n`,
      isDirty: false,
      isActive: true,
    };

    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    }));
  },

  // ── Load repo tree into sidebar ──
  loadRepoTree: async (owner: string, repo: string, branch?: string) => {
    const token = getGitHubToken();
    if (!token) {
      console.error('[EditorStore] No GitHub token — please sign in first');
      return;
    }

    const branchName = branch || 'main';
    set({ repoTreeLoading: true });

    try {
      const nodes = await fetchGitHubDirectory(
        owner,
        repo,
        '',
        branchName,
        token
      );

      set({
        currentRepo: { owner, repo, branch: branchName },
        repoTree: nodes,
        repoTreeLoading: false,
      });

      console.log(
        `[EditorStore] Loaded repo tree: ${owner}/${repo} (${nodes.length} items)`
      );
    } catch (error) {
      console.error('[EditorStore] Failed to load repo tree:', error);
      set({ repoTreeLoading: false });
      throw error;
    }
  },

  // ── Lazy-load directory children ──
  loadRepoTreeChildren: async (path: string) => {
    const state = get();
    if (!state.currentRepo) return;

    const token = getGitHubToken();
    if (!token) return;

    const { owner, repo, branch } = state.currentRepo;

    try {
      const children = await fetchGitHubDirectory(
        owner,
        repo,
        path,
        branch,
        token
      );

      const updateNodes = (nodes: RepoFileNode[]): RepoFileNode[] =>
        nodes.map((node) => {
          if (node.path === path) {
            return { ...node, children, childrenLoaded: true };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });

      set((s) => ({ repoTree: updateNodes(s.repoTree) }));
    } catch (error) {
      console.error('[EditorStore] Failed to load children for:', path, error);
    }
  },

  // ── Open a file from repo tree ──
  openRepoFile: async (path: string, name: string) => {
    const state = get();

    const existing = state.tabs.find((t) => t.filePath === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    if (!state.currentRepo) return;

    const token = getGitHubToken();
    if (!token) return;

    const { owner, repo, branch } = state.currentRepo;
    const ext = getExtension(path);
    const lang = getLanguageFromExtension(ext);
    const tabId = `repo-${path}-${Date.now()}`;

    let content = `// جاري تحميل ${path}...`;
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.raw+json',
        },
      });
      if (resp.ok) {
        content = await resp.text();
      } else {
        content = `// ⚠️ فشل تحميل الملف: ${path}\n// HTTP ${resp.status}: ${resp.statusText}`;
      }
    } catch (err) {
      content = `// ⚠️ خطأ في تحميل الملف: ${(err as Error).message}`;
    }

    const tab: EditorTab = {
      id: tabId,
      filePath: path,
      fileName: name,
      language: lang,
      content,
      isDirty: false,
      isActive: true,
    };

    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    }));
  },
}));
