'use client';

import { useMemo } from 'react';
import { useSettingsStore, SettingCategory } from '@/lib/stores/settings-store';
import SettingItem from './setting-item';
import { Search, Settings as SettingsIcon, RotateCcw } from 'lucide-react';

const CATEGORIES: Array<{ id: SettingCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Settings' },
  { id: 'editor', label: 'Editor' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'files', label: 'Files' },
  { id: 'keyboard', label: 'Keyboard' },
];

export default function SettingsList() {
  const {
    searchQuery,
    activeCategory,
    setSearchQuery,
    setActiveCategory,
    getFilteredSettings,
    resetAllSettings,
  } = useSettingsStore();

  const filteredSettings = useMemo(
    () => getFilteredSettings(),
    [getFilteredSettings]
  );

  // Group settings by category
  const groupedSettings = useMemo(() => {
    const groups: Record<SettingCategory, typeof filteredSettings> = {
      editor: [],
      appearance: [],
      terminal: [],
      files: [],
      keyboard: [],
    };

    filteredSettings.forEach((setting) => {
      groups[setting.category].push(setting);
    });

    return groups;
  }, [filteredSettings]);

  return (
    <div className="flex h-full flex-col">
      {/* Search and actions */}
      <div className="border-b border-border p-3">
        <div className="mb-2 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={resetAllSettings}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/80"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All Settings
        </button>
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

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredSettings.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <SettingsIcon className="h-12 w-12 opacity-50" />
            <p className="text-sm">
              {searchQuery
                ? `No settings found for "${searchQuery}"`
                : 'No settings available'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show by category when 'all' is selected */}
            {activeCategory === 'all' ? (
              Object.entries(groupedSettings).map(
                ([category, settings]) =>
                  settings.length > 0 && (
                    <div key={category}>
                      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        {CATEGORIES.find((c) => c.id === category)?.label ??
                          category}
                      </h2>
                      <div className="space-y-3">
                        {settings.map((setting) => (
                          <SettingItem key={setting.id} setting={setting} />
                        ))}
                      </div>
                    </div>
                  )
              )
            ) : (
              // Show flat list for specific category
              <div className="space-y-3">
                {filteredSettings.map((setting) => (
                  <SettingItem key={setting.id} setting={setting} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground">
          {filteredSettings.length} setting
          {filteredSettings.length !== 1 ? 's' : ''} shown
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>
    </div>
  );
}
