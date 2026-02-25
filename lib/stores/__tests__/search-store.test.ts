import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from '../search-store';
import type { SearchMatch } from '../search-store';

function resetStore() {
  useSearchStore.setState({
    query: '',
    replaceText: '',
    isRegex: false,
    isCaseSensitive: false,
    isWholeWord: false,
    results: [],
    isSearching: false,
    totalMatches: 0,
    currentMatchIndex: -1,
  });
}

const mockResults: SearchMatch[] = [
  { fileId: '1', fileName: 'index.ts', filePath: '/src/index.ts', line: 10, column: 5, lineContent: 'const foo = bar;', matchText: 'foo' },
  { fileId: '2', fileName: 'app.ts', filePath: '/src/app.ts', line: 20, column: 1, lineContent: 'export foo;', matchText: 'foo' },
  { fileId: '3', fileName: 'utils.ts', filePath: '/src/utils.ts', line: 5, column: 12, lineContent: 'function foo() {}', matchText: 'foo' },
];

describe('SearchStore', () => {
  beforeEach(() => resetStore());

  it('should start with empty state', () => {
    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.results).toHaveLength(0);
    expect(state.totalMatches).toBe(0);
    expect(state.currentMatchIndex).toBe(-1);
  });

  it('should set search query', () => {
    useSearchStore.getState().setQuery('test');
    expect(useSearchStore.getState().query).toBe('test');
  });

  it('should set replace text', () => {
    useSearchStore.getState().setReplaceText('replacement');
    expect(useSearchStore.getState().replaceText).toBe('replacement');
  });

  it('should toggle regex', () => {
    expect(useSearchStore.getState().isRegex).toBe(false);
    useSearchStore.getState().toggleRegex();
    expect(useSearchStore.getState().isRegex).toBe(true);
    useSearchStore.getState().toggleRegex();
    expect(useSearchStore.getState().isRegex).toBe(false);
  });

  it('should toggle case sensitivity', () => {
    expect(useSearchStore.getState().isCaseSensitive).toBe(false);
    useSearchStore.getState().toggleCaseSensitive();
    expect(useSearchStore.getState().isCaseSensitive).toBe(true);
  });

  it('should toggle whole word', () => {
    expect(useSearchStore.getState().isWholeWord).toBe(false);
    useSearchStore.getState().toggleWholeWord();
    expect(useSearchStore.getState().isWholeWord).toBe(true);
  });

  it('should set results and update counts', () => {
    useSearchStore.getState().setResults(mockResults);
    const state = useSearchStore.getState();
    expect(state.results).toHaveLength(3);
    expect(state.totalMatches).toBe(3);
    expect(state.currentMatchIndex).toBe(0);
  });

  it('should set currentMatchIndex to -1 when results are empty', () => {
    useSearchStore.getState().setResults([]);
    expect(useSearchStore.getState().currentMatchIndex).toBe(-1);
  });

  it('should set isSearching flag', () => {
    useSearchStore.getState().setIsSearching(true);
    expect(useSearchStore.getState().isSearching).toBe(true);
    useSearchStore.getState().setIsSearching(false);
    expect(useSearchStore.getState().isSearching).toBe(false);
  });

  it('should navigate to next match', () => {
    useSearchStore.getState().setResults(mockResults);
    expect(useSearchStore.getState().currentMatchIndex).toBe(0);
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(1);
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(2);
  });

  it('should wrap around to first match on next', () => {
    useSearchStore.getState().setResults(mockResults);
    useSearchStore.getState().nextMatch();
    useSearchStore.getState().nextMatch();
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(0);
  });

  it('should navigate to previous match', () => {
    useSearchStore.getState().setResults(mockResults);
    useSearchStore.getState().nextMatch(); // index 1
    useSearchStore.getState().previousMatch(); // index 0
    expect(useSearchStore.getState().currentMatchIndex).toBe(0);
  });

  it('should wrap around to last match on previous', () => {
    useSearchStore.getState().setResults(mockResults);
    useSearchStore.getState().previousMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(2);
  });

  it('should clear search state', () => {
    useSearchStore.getState().setQuery('test');
    useSearchStore.getState().setResults(mockResults);
    useSearchStore.getState().clearSearch();

    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.replaceText).toBe('');
    expect(state.results).toHaveLength(0);
    expect(state.totalMatches).toBe(0);
    expect(state.currentMatchIndex).toBe(-1);
    expect(state.isSearching).toBe(false);
  });

  it('should handle next/previous with no results', () => {
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(-1);
    useSearchStore.getState().previousMatch();
    expect(useSearchStore.getState().currentMatchIndex).toBe(-1);
  });
});
