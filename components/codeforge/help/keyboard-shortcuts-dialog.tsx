'use client';

import { useState, useEffect } from 'react';
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
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface Shortcut {
  keys: string;
  description: string;
  arabic: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

const shortcutsData: ShortcutCategory[] = [
  {
    category: 'Editor',
    shortcuts: [
      { keys: 'Ctrl+S', description: 'Save File', arabic: 'حفظ الملف' },
      { keys: 'Ctrl+W', description: 'Close Tab', arabic: 'إغلاق التبويب' },
      { keys: 'Ctrl+P', description: 'Quick Open', arabic: 'فتح سريع' },
      { keys: 'Ctrl+F', description: 'Find', arabic: 'بحث' },
      { keys: 'Ctrl+H', description: 'Replace', arabic: 'استبدال' },
      { keys: 'Ctrl+G', description: 'Go to Line', arabic: 'الذهاب إلى سطر' },
      { keys: 'Ctrl+/', description: 'Toggle Comment', arabic: 'تعليق السطر' },
      { keys: 'Alt+↑/↓', description: 'Move Line', arabic: 'نقل السطر' },
    ],
  },
  {
    category: 'Git',
    shortcuts: [
      {
        keys: 'Ctrl+Shift+G',
        description: 'Source Control',
        arabic: 'لوحة Git',
      },
      { keys: 'Ctrl+Enter', description: 'Commit', arabic: 'حفظ التغييرات' },
      { keys: 'Ctrl+Shift+P', description: 'Push', arabic: 'رفع' },
      { keys: 'Ctrl+Shift+U', description: 'Pull', arabic: 'جلب' },
    ],
  },
  {
    category: 'Terminal',
    shortcuts: [
      {
        keys: 'Ctrl+`',
        description: 'Toggle Terminal',
        arabic: 'تبديل المحطة',
      },
      {
        keys: 'Ctrl+Shift+`',
        description: 'New Terminal',
        arabic: 'محطة جديدة',
      },
      { keys: 'Ctrl+C', description: 'Stop Command', arabic: 'إيقاف الأمر' },
      { keys: 'Ctrl+L', description: 'Clear Screen', arabic: 'مسح الشاشة' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      {
        keys: 'Ctrl+B',
        description: 'Toggle Sidebar',
        arabic: 'تبديل الشريط الجانبي',
      },
      {
        keys: 'Ctrl+J',
        description: 'Toggle Panel',
        arabic: 'تبديل اللوحة السفلية',
      },
      {
        keys: 'Ctrl+Shift+E',
        description: 'Explorer',
        arabic: 'مستكشف الملفات',
      },
      {
        keys: 'Ctrl+0',
        description: 'Focus Sidebar',
        arabic: 'التركيز على الشريط',
      },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const dialogRef = useFocusTrap(open);

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  const filteredCategories = shortcutsData
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          shortcut.arabic.includes(searchQuery) ||
          shortcut.keys.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogRef as React.Ref<HTMLDivElement>}
        className="max-w-3xl h-[600px]"
        role="dialog"
        aria-labelledby="shortcuts-dialog-title"
        aria-describedby="shortcuts-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="shortcuts-dialog-title">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="shortcuts-dialog-description">
            اختصارات لوحة المفاتيح المتاحة في CodeForge IDE
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="ابحث عن اختصار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search keyboard shortcuts"
          />
        </div>

        <Tabs defaultValue="Editor" className="flex-1">
          <TabsList
            className="grid w-full grid-cols-4"
            role="tablist"
            aria-label="Shortcut categories"
          >
            <TabsTrigger value="Editor" role="tab">
              Editor
            </TabsTrigger>
            <TabsTrigger value="Git" role="tab">
              Git
            </TabsTrigger>
            <TabsTrigger value="Terminal" role="tab">
              Terminal
            </TabsTrigger>
            <TabsTrigger value="Navigation" role="tab">
              Navigation
            </TabsTrigger>
          </TabsList>

          <ScrollArea
            className="h-[400px] mt-4"
            role="region"
            aria-live="polite"
          >
            {filteredCategories.map((category) => (
              <TabsContent
                key={category.category}
                value={category.category}
                role="tabpanel"
                aria-labelledby={`tab-${category.category}`}
              >
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      role="listitem"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{shortcut.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {shortcut.arabic}
                        </p>
                      </div>
                      <kbd
                        className="px-3 py-1.5 text-sm font-mono font-semibold border rounded-md bg-muted"
                        aria-label={`Keyboard shortcut: ${shortcut.keys}`}
                      >
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <div className="text-sm text-muted-foreground text-center" role="note">
          Press{' '}
          <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
            Ctrl+K Ctrl+S
          </kbd>{' '}
          to open this dialog. Press{' '}
          <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
            Escape
          </kbd>{' '}
          to close.
        </div>
      </DialogContent>
    </Dialog>
  );
}
