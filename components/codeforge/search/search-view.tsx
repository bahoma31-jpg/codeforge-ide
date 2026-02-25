/**
 * CodeForge IDE - Search View Component
 * Agent 7: Search & Replace Engineer
 * 
 * Main search panel component
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSearchStore } from '@/lib/stores/search-store';
import SearchInput from './search-input';
import SearchResults from './search-results';

/**
 * Search View Component
 * Main search panel displayed in the sidebar when search activity is selected
 */
export default function SearchView(): JSX.Element {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { query, options, performSearch } = useSearchStore();

  /**
   * Debounced search effect
   * Triggers search 300ms after last query/options change
   */
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, options, performSearch]);

  /**
   * Keyboard shortcut: Ctrl+Shift+F to focus search
   * Note: This is handled by the main layout, but we keep it here for reference
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl+Shift+F or Cmd+Shift+F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        // Focus will be handled by parent component
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <SearchInput />
      <SearchResults />
    </div>
  );
}
