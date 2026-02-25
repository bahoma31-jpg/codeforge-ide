/**
 * CodeForge IDE - Search Options Component
 * Agent 7: Search & Replace Engineer
 * 
 * Search options buttons (Case Sensitive, Whole Word, Regex)
 */

'use client';

import { useSearchStore } from '@/lib/stores/search-store';
import { CaseSensitive, Regex } from 'lucide-react';

/**
 * Search Options Component
 * Displays toggle buttons for search options
 */
export default function SearchOptions(): JSX.Element {
  const { options, toggleCaseSensitive, toggleWholeWord, toggleRegex } =
    useSearchStore();

  return (
    <div className="flex items-center gap-0.5">
      {/* Case Sensitive */}
      <button
        onClick={toggleCaseSensitive}
        className={[
          'rounded p-1 transition-colors',
          options.caseSensitive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        ].join(' ')}
        title="Match Case (Alt+C)"
        type="button"
      >
        <CaseSensitive className="h-3.5 w-3.5" />
      </button>

      {/* Whole Word */}
      <button
        onClick={toggleWholeWord}
        className={[
          'rounded p-1 transition-colors',
          options.wholeWord
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        ].join(' ')}
        title="Match Whole Word (Alt+W)"
        type="button"
      >
        <span className="text-[10px] font-semibold leading-none">Ab</span>
      </button>

      {/* Regex */}
      <button
        onClick={toggleRegex}
        className={[
          'rounded p-1 transition-colors',
          options.useRegex
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        ].join(' ')}
        title="Use Regular Expression (Alt+R)"
        type="button"
      >
        <Regex className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
