'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import {
  setTheme as persistTheme,
  toggleTheme,
} from '@/lib/utils/theme';
import { GitBranch, Moon, Sun } from 'lucide-react';

export default function StatusBar() {
  const { theme, setTheme } = useUIStore();

  const onToggleTheme = () => {
    const next = toggleTheme(theme);
    setTheme(next);
    persistTheme(next);
  };

  return (
    <footer className="flex h-[22px] items-center justify-between border-t border-border bg-[hsl(var(--cf-statusbar))] px-3 text-xs text-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>
        <span>UTF-8</span>
        <span>Ln 1, Col 1</span>
      </div>

      <div className="flex items-center gap-4">
        <span>TypeScript</span>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1 hover:opacity-80"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-3 w-3" />
          ) : (
            <Sun className="h-3 w-3" />
          )}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </footer>
  );
}
