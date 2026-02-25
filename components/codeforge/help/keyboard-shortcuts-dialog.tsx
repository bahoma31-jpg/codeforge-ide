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
      { keys: 'Ctrl+Tab', description: 'Next Tab', arabic: 'التبويب التالي' },
      { keys: 'Ctrl+Shift+Tab', description: 'Previous Tab', arabic: 'التبويب السابق' },
      { keys: 'Ctrl+P', description: 'Quick Open', arabic: 'فتح سريع' },
      { keys: 'Ctrl+F', description: 'Find', arabic: 'بحث' },
      { keys: 'Ctrl+H', description: 'Replace', arabic: 'استبدال' },
      { keys: 'Ctrl+G', description: 'Go to Line', arabic: 'الذهاب إلى سطر' },
      { keys: 'Ctrl+/', description: 'Toggle Line Comment', arabic: 'تعليق السطر' },
      { keys: 'Alt+↑/↓', description: 'Move Line Up/Down', arabic: 'نقل السطر للأعلى/للأسفل' },
      { keys: 'Shift+Alt+↑/↓', description: 'Copy Line Up/Down', arabic: 'نسخ السطر للأعلى/للأسفل' },
      { keys: 'Ctrl+D', description: 'Select Word', arabic: 'تحديد الكلمة' },
      { keys: 'Ctrl+L', description: 'Select Line', arabic: 'تحديد السطر' },
      { keys: 'Alt+Click', description: 'Add Cursor', arabic: 'إضافة مؤشر' },
      { keys: 'Ctrl+Shift+K', description: 'Delete Line', arabic: 'حذف السطر' },
      { keys: 'Ctrl+Enter', description: 'Insert Line Below', arabic: 'سطر جديد تحت' },
      { keys: 'Ctrl+Shift+Enter', description: 'Insert Line Above', arabic: 'سطر جديد فوق' },
      { keys: 'Shift+Alt+F', description: 'Format Document', arabic: 'تنسيق المستند' },
    ],
  },
  {
    category: 'Git',
    shortcuts: [
      { keys: 'Ctrl+Shift+G', description: 'Source Control Panel', arabic: 'لوحة Git' },
      { keys: 'Ctrl+Enter', description: 'Commit (in Git panel)', arabic: 'حفظ التغييرات' },
      { keys: 'Ctrl+Shift+P', description: 'Push Changes', arabic: 'رفع' },
      { keys: 'Ctrl+Shift+U', description: 'Pull Changes', arabic: 'جلب' },
      { keys: 'Ctrl+K Ctrl+H', description: 'Git History', arabic: 'سجل Git' },
    ],
  },
  {
    category: 'Terminal',
    shortcuts: [
      { keys: 'Ctrl+`', description: 'Toggle Terminal', arabic: 'تبديل المحطة' },
      { keys: 'Ctrl+Shift+`', description: 'New Terminal', arabic: 'محطة جديدة' },
      { keys: 'Ctrl+Shift+W', description: 'Close Terminal', arabic: 'إغلاق المحطة' },
      { keys: 'Ctrl+C', description: 'Stop Command', arabic: 'إيقاف الأمر' },
      { keys: 'Ctrl+L', description: 'Clear Screen', arabic: 'مسح الشاشة' },
      { keys: '↑/↓', description: 'Command History', arabic: 'سجل الأوامر' },
      { keys: 'Tab', description: 'Auto Complete', arabic: 'إكمال تلقائي' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+B', description: 'Toggle Sidebar', arabic: 'تبديل الشريط الجانبي' },
      { keys: 'Ctrl+J', description: 'Toggle Panel', arabic: 'تبديل اللوحة السفلية' },
      { keys: 'Ctrl+Shift+E', description: 'File Explorer', arabic: 'مستكشف الملفات' },
      { keys: 'Ctrl+Shift+F', description: 'Search', arabic: 'بحث' },
      { keys: 'Ctrl+Shift+G', description: 'Source Control', arabic: 'التحكم بالمصدر' },
      { keys: 'Ctrl+0', description: 'Focus Sidebar', arabic: 'التركيز على الشريط' },
      { keys: 'Ctrl+1', description: 'Focus Editor', arabic: 'التركيز على المحرر' },
      { keys: 'F11', description: 'Full Screen', arabic: 'ملء الشاشة' },
      { keys: 'Ctrl+=', description: 'Zoom In', arabic: 'تكبير' },
      { keys: 'Ctrl+-', description: 'Zoom Out', arabic: 'تصغير' },
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
  const [activeTab, setActiveTab] = useState('Editor');

  const filteredCategories = shortcutsData
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.arabic.includes(searchQuery) ||
          shortcut.keys.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            اختصارات لوحة المفاتيح المتاحة في CodeForge IDE
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن اختصار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="Editor">Editor</TabsTrigger>
            <TabsTrigger value="Git">Git</TabsTrigger>
            <TabsTrigger value="Terminal">Terminal</TabsTrigger>
            <TabsTrigger value="Navigation">Navigation</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {filteredCategories.map((category) => (
                <TabsContent key={category.category} value={category.category} className="mt-0">
                  <div className="space-y-2 pr-4">
                    {category.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{shortcut.description}</p>
                          <p className="text-xs text-muted-foreground">{shortcut.arabic}</p>
                        </div>
                        <kbd className="px-3 py-1.5 text-sm font-mono font-semibold border rounded-md bg-muted group-hover:bg-background transition-colors">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </div>
        </Tabs>

        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          Press{' '}
          <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">?</kbd>{' '}
          or{' '}
          <kbd className="px-2 py-1 mx-1 text-xs font-mono border rounded bg-muted">
            Ctrl+K Ctrl+S
          </kbd>{' '}
          to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
