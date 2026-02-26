'use client';

/**
 * CodeForge IDE — Search Panel v1.0
 * File content search with regex support.
 * Searches across all project files in the local store.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Search,
  FileText,
  CaseSensitive,
  Regex,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import type { FileNode } from '@/lib/db/schema';

interface SearchResult {
  file: FileNode;
  line: number;
  content: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel() {
  const { fileTree } = useFilesStore();
  const { openFile } = useEditorStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten file tree to get all files
  const flattenFiles = useCallback((nodes: FileNode[]): FileNode[] => {
    const files: FileNode[] = [];
    const walk = (list: (FileNode & { children?: FileNode[] })[]) => {
      for (const node of list) {
        if (node.type === 'file') files.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(nodes as (FileNode & { children?: FileNode[] })[]);
    return files;
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim() || !fileTree) return;

    setIsSearching(true);
    setSearchDone(false);

    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const allFiles = flattenFiles(fileTree);
      const found: SearchResult[] = [];

      let pattern: RegExp;
      try {
        if (useRegex) {
          pattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
        } else {
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          pattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
        }
      } catch {
        setIsSearching(false);
        setSearchDone(true);
        return;
      }

      for (const file of allFiles) {
        if (!file.content) continue;
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const match = pattern.exec(lines[i]);
          if (match) {
            found.push({
              file,
              line: i + 1,
              content: lines[i].trim(),
              matchStart: match.index,
              matchEnd: match.index + match[0].length,
            });
          }
          pattern.lastIndex = 0; // Reset for next line
        }
        if (found.length > 200) break; // Limit results
      }

      setResults(found);
      setIsSearching(false);
      setSearchDone(true);
    }, 50);
  }, [query, fileTree, caseSensitive, useRegex, flattenFiles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const openResult = useCallback(
    (result: SearchResult) => {
      openFile({
        id: result.file.id,
        name: result.file.name,
        content: result.file.content || '',
        language: result.file.language || 'plaintext',
        path: result.file.path,
      });
    },
    [openFile]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-2 border-b border-[#313244]">
        <div className="flex items-center gap-1 rounded-md border border-[#313244] bg-[#1e1e2e] px-2 py-1">
          <Search size={12} className="text-[#6c7086] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث في الملفات..."
            className="flex-1 bg-transparent text-xs text-[#cdd6f4] placeholder:text-[#45475a] focus:outline-none"
            dir="auto"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearchDone(false); }}
              className="text-[#6c7086] hover:text-[#cdd6f4]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-1 mt-1.5">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={cn(
              'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
              caseSensitive
                ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            )}
            title="حساسية لحالة الأحرف"
          >
            <CaseSensitive size={12} />
            Aa
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={cn(
              'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
              useRegex
                ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            )}
            title="تعبير منتظم (Regex)"
          >
            <Regex size={12} />
            .*
          </button>
          <div className="flex-1" />
          {searchDone && (
            <span className="text-[10px] text-[#6c7086]">
              {results.length} نتيجة
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-[#6c7086]" />
          </div>
        )}

        {!isSearching && searchDone && results.length === 0 && (
          <div className="p-4 text-center text-[11px] text-[#6c7086]">
            لا توجد نتائج لـ "{query}"
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="py-1">
            {results.map((result, idx) => (
              <button
                key={`${result.file.id}-${result.line}-${idx}`}
                onClick={() => openResult(result)}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-[#313244]/50 transition-colors"
              >
                <FileText size={12} className="text-[#6c7086] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-[#89b4fa] truncate">
                      {result.file.name}
                    </span>
                    <span className="text-[9px] text-[#45475a]">:{result.line}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#a6adc8] truncate" dir="ltr">
                    {result.content.length > 100
                      ? result.content.slice(0, 100) + '...'
                      : result.content}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isSearching && !searchDone && (
          <div className="p-4 text-center text-[11px] text-[#6c7086]">
            اكتب كلمة بحث واضغط Enter
          </div>
        )}
      </div>
    </div>
  );
}
