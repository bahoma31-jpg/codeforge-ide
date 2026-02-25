import { create } from 'zustand';

/** Extension status */
export type ExtensionStatus = 'installed' | 'enabled' | 'disabled' | 'available';

/** Extension definition */
export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  status: ExtensionStatus;
  category: string;
  icon?: string;
  enabled: boolean;
  installedAt?: number;
}

/** Extensions store interface */
export interface ExtensionsStore {
  extensions: Extension[];
  installedCount: number;
  enabledCount: number;
  searchQuery: string;
  selectedCategory: string;

  addExtension: (extension: Omit<Extension, 'installedAt'>) => void;
  removeExtension: (id: string) => void;
  enableExtension: (id: string) => void;
  disableExtension: (id: string) => void;
  toggleExtension: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  getFilteredExtensions: () => Extension[];
  clearAll: () => void;
}

export const useExtensionsStore = create<ExtensionsStore>((set, get) => ({
  extensions: [],
  installedCount: 0,
  enabledCount: 0,
  searchQuery: '',
  selectedCategory: 'all',

  addExtension: (extension) =>
    set((state) => {
      const exists = state.extensions.some((e) => e.id === extension.id);
      if (exists) return state;

      const newExt: Extension = {
        ...extension,
        installedAt: Date.now(),
      };
      const updated = [...state.extensions, newExt];
      return {
        extensions: updated,
        installedCount: updated.length,
        enabledCount: updated.filter((e) => e.enabled).length,
      };
    }),

  removeExtension: (id: string) =>
    set((state) => {
      const updated = state.extensions.filter((e) => e.id !== id);
      return {
        extensions: updated,
        installedCount: updated.length,
        enabledCount: updated.filter((e) => e.enabled).length,
      };
    }),

  enableExtension: (id: string) =>
    set((state) => {
      const updated = state.extensions.map((e) =>
        e.id === id ? { ...e, enabled: true, status: 'enabled' as ExtensionStatus } : e
      );
      return {
        extensions: updated,
        enabledCount: updated.filter((e) => e.enabled).length,
      };
    }),

  disableExtension: (id: string) =>
    set((state) => {
      const updated = state.extensions.map((e) =>
        e.id === id ? { ...e, enabled: false, status: 'disabled' as ExtensionStatus } : e
      );
      return {
        extensions: updated,
        enabledCount: updated.filter((e) => e.enabled).length,
      };
    }),

  toggleExtension: (id: string) => {
    const ext = get().extensions.find((e) => e.id === id);
    if (ext?.enabled) {
      get().disableExtension(id);
    } else {
      get().enableExtension(id);
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSelectedCategory: (category: string) => set({ selectedCategory: category }),

  getFilteredExtensions: (): Extension[] => {
    const { extensions, searchQuery, selectedCategory } = get();
    return extensions.filter((ext) => {
      const matchesSearch =
        !searchQuery ||
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || ext.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  },

  clearAll: () =>
    set({
      extensions: [],
      installedCount: 0,
      enabledCount: 0,
      searchQuery: '',
      selectedCategory: 'all',
    }),
}));
