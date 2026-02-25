/**
 * CodeForge IDE - Search Result Item Component
 * Agent 7: Search & Replace Engineer
 * 
 * Single search result item with match highlighting
 */

'use client';

import { useState } from 'react';
import { useSearchStore, type SearchMatch } from '@/lib/stores/search-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useFilesStore } from '@/lib/stores/files-store';
import { Replace } from 'lucide-react';

interface SearchResultItemProps {
  fileId: string;
  match: SearchMatch;
}

/**
 * Search Result Item Component
 * Displays a single match with line number and highlighted text
 */
export default function SearchResultItem({
  fileId,
  match,
}: SearchResultItemProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const { isReplaceVisible, replaceOne } = useSearchStore();
  const { openFile } = useEditorStore();
  const { readFile } = useFilesStore();

  /**
   * Render highlighted line with match
   */
  const renderHighlightedLine = (m: SearchMatch): JSX.Element => {
    const { lineContent, column, length } = m;
    const contextSize = 20;
    
    // Calculate visible portion
    const startContext = Math.max(0, column - contextSize);
    const endContext = Math.min(lineContent.length, column + length + contextSize);
    
    const before = lineContent.slice(startContext, column);
    const matched = lineContent.slice(column, column + length);
    const after = lineContent.slice(column + length, endContext);

    return (
      <span className="text-xs font-mono">
        {startContext > 0 && (
          <span className="text-muted-foreground">…</span>
        )}
        <span className="text-muted-foreground">{before}</span>
        <span className="bg-yellow-500/30 text-foreground rounded-sm px-0.5">
          {matched}
        </span>
        <span className="text-muted-foreground">{after}</span>
        {endContext < lineContent.length && (
          <span className="text-muted-foreground">…</span>
        )}
      </span>
    );
  };

  /**
   * Handle click on result - open file and navigate to line
   */
  const handleClick = async (): Promise<void> => {
    try {
      const fileData = await readFile(fileId);
      openFile({
        id: fileId,
        name: fileData.name,
        content: fileData.content || '',
        language: fileData.language,
        path: fileData.path || `/${fileData.name}`,
      });
      
      // TODO: Add scroll to line functionality when Monaco editor is integrated
      // For now, just open the file
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  /**
   * Handle replace single match
   */
  const handleReplace = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    await replaceOne(fileId, match);
  };

  return (
    <div
      className="group flex items-start gap-2 px-2 py-1 hover:bg-secondary rounded cursor-pointer transition-colors"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Line number */}
      <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-8 text-right">
        {match.lineNumber}
      </span>

      {/* Line content with highlighting */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {renderHighlightedLine(match)}
      </div>

      {/* Replace button (shows on hover if replace is visible) */}
      {isReplaceVisible && isHovered && (
        <button
          onClick={handleReplace}
          className="flex-shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
          title="Replace this match"
          type="button"
        >
          <Replace className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
