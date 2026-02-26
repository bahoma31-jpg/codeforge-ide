import { create } from 'zustand';
import {
  getLanguageFromExtension,
  getExtension,
  getFileName,
} from '@/lib/utils/file-path-detect';

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
}

/**
 * Fetch file content from GitHub API.
 * Reads the GitHub token and repo info from agent config in localStorage.
 */
async function fetchFileFromGitHub(
  filePath: string
): Promise<{ content: string; found: boolean }> {
  try {
    // Read agent config from localStorage
    const configRaw = localStorage.getItem('codeforge-agent-config');
    if (!configRaw) return { content: '', found: false };

    const config = JSON.parse(configRaw);
    const token = config.githubToken;
    if (!token) return { content: '', found: false };

    // Try to determine repo from URL or stored project context
    const projectRaw = localStorage.getItem('codeforge-project-context');
    let owner = '';
    let repo = '';
    let branch = 'main';

    if (projectRaw) {
      try {
        const project = JSON.parse(projectRaw);
        if (project.repoUrl) {
          const urlMatch = project.repoUrl.match(
            /github\.com\/([^/]+)\/([^/]+)/
          );
          if (urlMatch) {
            owner = urlMatch[1];
            repo = urlMatch[2].replace(/\.git$/, '');
          }
        }
        if (project.currentBranch) {
          branch = project.currentBranch;
        }
      } catch {
        // ignore parse errors
      }
    }

    if (!owner || !repo) return { content: '', found: false };

    // Fetch file from GitHub Contents API
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
      const decoded = atob(data.content.replace(/\n/g, ''));
      return { content: decoded, found: true };
    }

    return { content: '', found: false };
  } catch (error) {
    console.error('[EditorStore] Failed to fetch from GitHub:', error);
    return { content: '', found: false };
  }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

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
        state.activeTabId === id ? (newTabs[0]?.id ?? null) : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    })),

  // Helper function to open a file from the file system
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
      // Check if file is already open
      const exists = state.tabs.find((t) => t.id === file.id);
      if (exists) {
        // Just activate it
        return { activeTabId: exists.id };
      }

      // Add new tab
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    });
  },

  // Open a file from a path string (e.g., clicked from chat message)
  openFileFromPath: async (filePath: string, language?: string) => {
    const state = get();
    const cleanPath = filePath.replace(/^\/+/, '');

    // Check if file is already open
    const existingTab = state.tabs.find(
      (t) => t.filePath === cleanPath || t.filePath === '/' + cleanPath
    );
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Determine language from extension if not provided
    const ext = getExtension(cleanPath);
    const lang = language || getLanguageFromExtension(ext);
    const fileName = getFileName(cleanPath);
    const tabId = `file-${cleanPath}-${Date.now()}`;

    // Try to fetch from GitHub
    const { content, found } = await fetchFileFromGitHub(cleanPath);

    const tab: EditorTab = {
      id: tabId,
      filePath: cleanPath,
      fileName,
      language: lang,
      content: found
        ? content
        : `// ⏳ لم يتم العثور على محتوى الملف: ${cleanPath}\n// تأكد من إعداد GitHub Token وبيانات المشروع في إعدادات الوكيل\n// أو قم بتعديل المحتوى يدوياً هنا\n`,
      isDirty: false,
      isActive: true,
    };

    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    }));
  },
}));
