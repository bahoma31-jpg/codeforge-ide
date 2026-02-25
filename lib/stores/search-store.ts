/**
 * CodeForge IDE - Search Store
 * Agent 7: Search & Replace Engineer
 * 
 * Zustand store for search and replace functionality
 */

import { create } from 'zustand';
import { useFilesStore } from './files-store';
import { useEditorStore } from './editor-store';

/**
 * Single search match within a file
 */
export interface SearchMatch {
  /** Line number (1-based) */
  lineNumber: number;
  /** Column position of match start */
  column: number;
  /** Length of matched text */
  length: number;
  /** Full line content */
  lineContent: string;
  /** Matched text */
  matchText: string;
}

/**
 * Search results grouped by file
 */
export interface FileSearchResult {
  /** File ID from files-store */
  fileId: string;
  /** File name */
  fileName: string;
  /** Full file path */
  filePath: string;
  /** Array of matches in this file */
  matches: SearchMatch[];
}

/**
 * Search options configuration
 */
export interface SearchOptions {
  /** Match case sensitive */
  caseSensitive: boolean;
  /** Match whole word only */
  wholeWord: boolean;
  /** Use regular expressions */
  useRegex: boolean;
}

/**
 * Search store state and actions
 */
interface SearchStore {
  // State
  query: string;
  replaceText: string;
  options: SearchOptions;
  results: FileSearchResult[];
  totalMatches: number;
  isSearching: boolean;
  isReplaceVisible: boolean;
  selectedResultIndex: number | null;

  // Actions
  setQuery: (query: string) => void;
  setReplaceText: (text: string) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleRegex: () => void;
  toggleReplaceVisible: () => void;
  setResults: (results: FileSearchResult[]) => void;
  setSelectedResult: (index: number | null) => void;
  performSearch: () => Promise<void>;
  replaceOne: (fileId: string, match: SearchMatch) => Promise<void>;
  replaceAllInFile: (fileId: string) => Promise<void>;
  replaceAll: () => Promise<void>;
  clearSearch: () => void;
}

/**
 * Create search store
 */
export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  query: '',
  replaceText: '',
  options: {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  },
  results: [],
  totalMatches: 0,
  isSearching: false,
  isReplaceVisible: false,
  selectedResultIndex: null,

  // Set search query
  setQuery: (query) => set({ query }),

  // Set replace text
  setReplaceText: (text) => set({ replaceText: text }),

  // Toggle case sensitive option
  toggleCaseSensitive: () =>
    set((state) => ({
      options: { ...state.options, caseSensitive: !state.options.caseSensitive },
    })),

  // Toggle whole word option
  toggleWholeWord: () =>
    set((state) => ({
      options: { ...state.options, wholeWord: !state.options.wholeWord },
    })),

  // Toggle regex option
  toggleRegex: () =>
    set((state) => ({
      options: { ...state.options, useRegex: !state.options.useRegex },
    })),

  // Toggle replace visibility
  toggleReplaceVisible: () =>
    set((state) => ({ isReplaceVisible: !state.isReplaceVisible })),

  // Set search results
  setResults: (results) => {
    const total = results.reduce((sum, file) => sum + file.matches.length, 0);
    set({ results, totalMatches: total });
  },

  // Set selected result
  setSelectedResult: (index) => set({ selectedResultIndex: index }),

  // Perform search across all files
  performSearch: async () => {
    const { query, options } = get();
    
    // Clear results if query is empty
    if (!query.trim()) {
      set({ results: [], totalMatches: 0 });
      return;
    }

    set({ isSearching: true });

    try {
      // Get files from files-store
      const { nodes, readFile } = useFilesStore.getState();
      const files = nodes.filter((n) => n.type === 'file');
      const results: FileSearchResult[] = [];
      let total = 0;

      // Build search pattern
      let pattern: RegExp;
      try {
        const escaped = options.useRegex
          ? query
          : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundary = options.wholeWord ? `\\b${escaped}\\b` : escaped;
        const flags = options.caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(wordBoundary, flags);
      } catch {
        // Invalid regex
        set({ isSearching: false, results: [], totalMatches: 0 });
        return;
      }

      // Search each file
      for (const file of files) {
        try {
          const fileData = await readFile(file.id);
          const content = fileData.content || '';
          const lines = content.split('\n');
          const matches: SearchMatch[] = [];

          // Search each line
          lines.forEach((line, idx) => {
            let match: RegExpExecArray | null;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(line)) !== null) {
              matches.push({
                lineNumber: idx + 1,
                column: match.index,
                length: match[0].length,
                lineContent: line,
                matchText: match[0],
              });
              // Prevent infinite loop for non-global regex
              if (!pattern.global) break;
            }
          });

          // Add to results if matches found
          if (matches.length > 0) {
            results.push({
              fileId: file.id,
              fileName: file.name,
              filePath: file.path || `/${file.name}`,
              matches,
            });
            total += matches.length;
          }
        } catch {
          // Ignore files that cannot be read
        }
      }

      set({ results, totalMatches: total, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  // Replace single match
  replaceOne: async (fileId: string, match: SearchMatch) => {
    const { replaceText } = get();
    const { readFile, updateFile } = useFilesStore.getState();

    try {
      // Read file
      const fileData = await readFile(fileId);
      const content = fileData.content || '';
      const lines = content.split('\n');

      // Replace in specific line
      const lineIdx = match.lineNumber - 1;
      if (lineIdx >= 0 && lineIdx < lines.length) {
        const line = lines[lineIdx];
        const before = line.substring(0, match.column);
        const after = line.substring(match.column + match.length);
        lines[lineIdx] = before + replaceText + after;

        // Update file
        const newContent = lines.join('\n');
        await updateFile(fileId, { content: newContent });

        // Update editor if file is open
        const { tabs, updateTabContent } = useEditorStore.getState();
        const tab = tabs.find((t) => t.id === fileId);
        if (tab) {
          updateTabContent(fileId, newContent);
        }

        // Re-run search to update results
        await get().performSearch();
      }
    } catch (error) {
      console.error('Replace one error:', error);
    }
  },

  // Replace all matches in a file
  replaceAllInFile: async (fileId: string) => {
    const { replaceText, results } = get();
    const { readFile, updateFile } = useFilesStore.getState();

    // Find file results
    const fileResult = results.find((r) => r.fileId === fileId);
    if (!fileResult || fileResult.matches.length === 0) return;

    try {
      // Read file
      const fileData = await readFile(fileId);
      const content = fileData.content || '';
      const lines = content.split('\n');

      // Sort matches by line and column (reverse order to maintain positions)
      const sortedMatches = [...fileResult.matches].sort(
        (a, b) =>
          b.lineNumber - a.lineNumber || b.column - a.column
      );

      // Replace each match
      for (const match of sortedMatches) {
        const lineIdx = match.lineNumber - 1;
        if (lineIdx >= 0 && lineIdx < lines.length) {
          const line = lines[lineIdx];
          const before = line.substring(0, match.column);
          const after = line.substring(match.column + match.length);
          lines[lineIdx] = before + replaceText + after;
        }
      }

      // Update file
      const newContent = lines.join('\n');
      await updateFile(fileId, { content: newContent });

      // Update editor if file is open
      const { tabs, updateTabContent } = useEditorStore.getState();
      const tab = tabs.find((t) => t.id === fileId);
      if (tab) {
        updateTabContent(fileId, newContent);
      }

      // Re-run search to update results
      await get().performSearch();
    } catch (error) {
      console.error('Replace all in file error:', error);
    }
  },

  // Replace all matches in all files
  replaceAll: async () => {
    const { results } = get();

    // Replace in each file sequentially
    for (const fileResult of results) {
      await get().replaceAllInFile(fileResult.fileId);
    }
  },

  // Clear search
  clearSearch: () =>
    set({
      query: '',
      replaceText: '',
      results: [],
      totalMatches: 0,
      selectedResultIndex: null,
    }),
}));
