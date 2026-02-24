import { create } from 'zustand';

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
  openFile: (file: { id: string; name: string; content: string; language?: string; path: string }) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
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
      isActive: true
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
        activeTabId: tab.id
      };
    });
  }
}));
