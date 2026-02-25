/**
 * CodeForge IDE - Search Input Component
 * Agent 7: Search & Replace Engineer
 * 
 * Search and replace input fields
 */

'use client';

import { useRef, ChangeEvent } from 'react';
import { useSearchStore } from '@/lib/stores/search-store';
import { Search, ChevronRight, ChevronDown, Replace, ReplaceAll } from 'lucide-react';
import SearchOptions from './search-options';

/**
 * Search Input Component
 * Displays search field with options and optional replace field
 */
export default function SearchInput(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    replaceText,
    isReplaceVisible,
    setQuery,
    setReplaceText,
    toggleReplaceVisible,
    replaceAll,
  } = useSearchStore();

  /**
   * Handle query change
   */
  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  /**
   * Handle replace text change
   */
  const handleReplaceChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setReplaceText(e.target.value);
  };

  /**
   * Handle replace all
   */
  const handleReplaceAll = (): void => {
    replaceAll();
  };

  /**
   * Focus search input (exported for keyboard shortcut)
   */
  const focusSearchInput = (): void => {
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Search Input */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 rounded border border-border bg-[hsl(var(--cf-editor))] px-2 py-1">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <SearchOptions />
          <button
            onClick={toggleReplaceVisible}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Toggle Replace"
            type="button"
          >
            {isReplaceVisible ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Replace Input (conditional) */}
      {isReplaceVisible && (
        <div className="flex items-center gap-1">
          <div className="flex-1 flex items-center gap-1 rounded border border-border bg-[hsl(var(--cf-editor))] px-2 py-1">
            <input
              type="text"
              value={replaceText}
              onChange={handleReplaceChange}
              placeholder="Replace"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleReplaceAll}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Replace All (Ctrl+Shift+Enter)"
              type="button"
              disabled={!query || !replaceText}
            >
              <ReplaceAll className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export focus function for keyboard shortcuts
export { SearchInput };
