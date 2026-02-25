'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Editor
  { keys: ['Ctrl', 'S'], description: 'Save current file', category: 'Editor' },
  { keys: ['Ctrl', 'W'], description: 'Close current tab', category: 'Editor' },
  { keys: ['Ctrl', 'Tab'], description: 'Next tab', category: 'Editor' },
  { keys: ['Ctrl', 'Shift', 'Tab'], description: 'Previous tab', category: 'Editor' },
  { keys: ['Ctrl', 'P'], description: 'Quick open file', category: 'Editor' },
  { keys: ['Ctrl', '/'], description: 'Toggle line comment', category: 'Editor' },
  { keys: ['Ctrl', 'D'], description: 'Select next occurrence', category: 'Editor' },
  { keys: ['Alt', '↑/↓'], description: 'Move line up/down', category: 'Editor' },
  { keys: ['Ctrl', 'F'], description: 'Find', category: 'Editor' },
  { keys: ['Ctrl', 'H'], description: 'Replace', category: 'Editor' },
  { keys: ['F12'], description: 'Go to definition', category: 'Editor' },
  
  // Git
  { keys: ['Ctrl', 'Shift', 'G'], description: 'Open source control', category: 'Git' },
  { keys: ['Ctrl', 'Enter'], description: 'Commit changes', category: 'Git' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Push to remote', category: 'Git' },
  { keys: ['Ctrl', 'K', 'Ctrl', 'S'], description: 'Stage file', category: 'Git' },
  { keys: ['Ctrl', 'K', 'Ctrl', 'D'], description: 'View diff', category: 'Git' },
  
  // Terminal
  { keys: ['Ctrl', '`'], description: 'Toggle terminal', category: 'Terminal' },
  { keys: ['Ctrl', 'Shift', '`'], description: 'New terminal', category: 'Terminal' },
  { keys: ['Ctrl', 'Shift', 'W'], description: 'Close terminal', category: 'Terminal' },
  { keys: ['Ctrl', 'C'], description: 'Cancel command', category: 'Terminal' },
  { keys: ['Ctrl', 'L'], description: 'Clear terminal', category: 'Terminal' },
  
  // Navigation
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', 'J'], description: 'Toggle panel', category: 'Navigation' },
  { keys: ['Ctrl', 'Shift', 'E'], description: 'Show file explorer', category: 'Navigation' },
  { keys: ['Ctrl', '0'], description: 'Focus sidebar', category: 'Navigation' },
  { keys: ['Ctrl', '1-9'], description: 'Focus editor group', category: 'Navigation' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...new Set(shortcuts.map((s) => s.category))];

  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const matchesSearch =
      search === '' ||
      shortcut.description.toLowerCase().includes(search.toLowerCase()) ||
      shortcut.keys.some((key) => key.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      activeCategory === 'all' || shortcut.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            View and search keyboard shortcuts for CodeForge IDE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="flex-1">
                  {category === 'all' ? 'All' : category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3">{category}</h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                          >
                            <span className="text-sm">{shortcut.description}</span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <kbd
                                  key={keyIndex}
                                  className="px-2 py-1 text-xs font-semibold border rounded bg-muted"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Press <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">?</kbd> or{' '}
            <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">Ctrl+K</kbd>{' '}
            <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">Ctrl+S</kbd> to open this dialog
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
