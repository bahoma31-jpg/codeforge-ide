'use client';

import { useMemo } from 'react';
import { useExtensionsStore, ExtensionCategory } from '@/lib/stores/extensions-store';
import ExtensionCard from './extension-card';
import { Search, Package } from 'lucide-react';

const CATEGORIES: Array<{ id: ExtensionCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'language', label: 'Languages' },
  { id: 'theme', label: 'Themes' },
  { id: 'formatter', label: 'Formatters' },
  { id: 'linter', label: 'Linters' },
  { id: 'utility', label: 'Utilities' },
];

export default function ExtensionsList() {
  const {
    searchQuery,
    activeCategory,
    setSearchQuery,
    setActiveCategory,
    getFilteredExtensions,
  } = useExtensionsStore();

  const filteredExtensions = useMemo(
    () => getFilteredExtensions(),
    [getFilteredExtensions]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto p-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={[
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              ].join(' ')}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extensions list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredExtensions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-12 w-12 opacity-50" />
            <p className="text-sm">
              {searchQuery
                ? `No extensions found for "${searchQuery}"`
                : 'No extensions available'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExtensions.map((extension) => (
              <ExtensionCard key={extension.id} extension={extension} />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground">
          {filteredExtensions.length} extension
          {filteredExtensions.length !== 1 ? 's' : ''} shown
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>
    </div>
  );
}
