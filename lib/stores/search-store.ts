import { create } from 'zustand';

/** Search match result */
export interface SearchMatch {
  fileId: string;
  fileName: string;
  filePath: string;
  line: number;
  column: number;
  lineContent: string;
  matchText: string;
}

/** Search store interface */
export interface SearchStore {
  query: string;
  replaceText: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  isWholeWord: boolean;
  results: SearchMatch[];
  isSearching: boolean;
  totalMatches: number;
  currentMatchIndex: number;

  setQuery: (query: string) => void;
  setReplaceText: (text: string) => void;
  toggleRegex: () => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  setResults: (results: SearchMatch[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  nextMatch: () => void;
  previousMatch: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  replaceText: '',
  isRegex: false,
  isCaseSensitive: false,
  isWholeWord: false,
  results: [],
  isSearching: false,
  totalMatches: 0,
  currentMatchIndex: -1,

  setQuery: (query: string) => set({ query }),

  setReplaceText: (text: string) => set({ replaceText: text }),

  toggleRegex: () => set((state) => ({ isRegex: !state.isRegex })),

  toggleCaseSensitive: () =>
    set((state) => ({ isCaseSensitive: !state.isCaseSensitive })),

  toggleWholeWord: () => set((state) => ({ isWholeWord: !state.isWholeWord })),

  setResults: (results: SearchMatch[]) =>
    set({
      results,
      totalMatches: results.length,
      currentMatchIndex: results.length > 0 ? 0 : -1,
    }),

  setIsSearching: (isSearching: boolean) => set({ isSearching }),

  nextMatch: () =>
    set((state) => ({
      currentMatchIndex:
        state.totalMatches > 0
          ? (state.currentMatchIndex + 1) % state.totalMatches
          : -1,
    })),

  previousMatch: () =>
    set((state) => ({
      currentMatchIndex:
        state.totalMatches > 0
          ? (state.currentMatchIndex - 1 + state.totalMatches) %
            state.totalMatches
          : -1,
    })),

  clearSearch: () =>
    set({
      query: '',
      replaceText: '',
      results: [],
      totalMatches: 0,
      currentMatchIndex: -1,
      isSearching: false,
    }),
}));
