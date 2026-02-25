/**
 * CodeForge IDE - Search Results Component
 * Agent 7: Search & Replace Engineer
 * 
 * Display search results grouped by file
 */

'use client';

import { useState } from 'react';
import { useSearchStore } from '@/lib/stores/search-store';
import { ChevronRight, File, Loader2 } from 'lucide-react';
import SearchResultItem from './search-result-item';

/**
 * Search Results Component
 * Displays results grouped by file with collapsible sections
 */
export default function SearchResults(): JSX.Element {
  const { results, totalMatches, isSearching, query, isReplaceVisible, replaceAllInFile } =
    useSearchStore();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(results.map((r) => r.fileId))
  );
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);

  /**
   * Toggle file expansion
   */
  const toggleFile = (fileId: string): void => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  /**
   * Handle replace all in file
   */
  const handleReplaceAllInFile = async (
    e: React.MouseEvent,
    fileId: string
  ): Promise<void> => {
    e.stopPropagation();
    await replaceAllInFile(fileId);
  };

  // Expand all files when results change
  if (results.length > 0) {
    const allFileIds = new Set(results.map((r) => r.fileId));
    if (expandedFiles.size !== allFileIds.size) {
      setExpandedFiles(allFileIds);
    }
  }

  // Searching state
  if (isSearching) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Searching...</span>
      </div>
    );
  }

  // No query
  if (!query.trim()) {
    return (
      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
        Enter text to search across all files
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
        No results found
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Summary bar */}
      <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border">
        {totalMatches} result{totalMatches !== 1 ? 's' : ''} in {results.length} file
        {results.length !== 1 ? 's' : ''}
      </div>

      {/* Results by file */}
      <div className="flex flex-col">
        {results.map((fileResult) => {
          const isExpanded = expandedFiles.has(fileResult.fileId);
          const isHovered = hoveredFileId === fileResult.fileId;

          return (
            <div key={fileResult.fileId} className="border-b border-border last:border-b-0">
              {/* File header */}
              <div
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-secondary cursor-pointer transition-colors group"
                onClick={() => toggleFile(fileResult.fileId)}
                onMouseEnter={() => setHoveredFileId(fileResult.fileId)}
                onMouseLeave={() => setHoveredFileId(null)}
              >
                {/* Chevron */}
                <ChevronRight
                  className={[
                    'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                    isExpanded ? 'rotate-90' : '',
                  ].join(' ')}
                />

                {/* File icon */}
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                {/* File name */}
                <span className="text-sm flex-1 truncate">{fileResult.fileName}</span>

                {/* Match count badge */}
                <span className="bg-secondary rounded-full text-xs px-1.5 py-0.5 text-muted-foreground">
                  {fileResult.matches.length}
                </span>

                {/* Replace all in file button */}
                {isReplaceVisible && isHovered && (
                  <button
                    onClick={(e) => handleReplaceAllInFile(e, fileResult.fileId)}
                    className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Replace all in this file"
                    type="button"
                  >
                    Replace All
                  </button>
                )}
              </div>

              {/* Matches list */}
              {isExpanded && (
                <div className="flex flex-col">
                  {fileResult.matches.map((match, idx) => (
                    <SearchResultItem
                      key={`${fileResult.fileId}-${match.lineNumber}-${match.column}-${idx}`}
                      fileId={fileResult.fileId}
                      match={match}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
