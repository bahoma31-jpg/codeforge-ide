'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { setTheme as persistTheme, toggleTheme } from '@/lib/utils/theme';
import { GitBranch, Moon, Sun } from 'lucide-react';

export default function StatusBar() {
  const { theme, setTheme } = useUIStore();

  const onToggleTheme = () => {
    const next = toggleTheme(theme);
    setTheme(next);
    persistTheme(next);
  };

  return (
    <footer 
      role="contentinfo" 
      aria-label="Status bar"
      className="flex h-[22px] items-center justify-between border-t border-border bg-[hsl(var(--cf-statusbar))] px-3 text-xs text-white"
    >
      <div className="flex items-center gap-4" role="status" aria-label="Editor status">
        <div className="flex items-center gap-1" aria-label="Current branch: main">
          <GitBranch className="h-3 w-3" aria-hidden="true" />
          <span>main</span>
        </div>
        <span aria-label="Encoding">UTF-8</span>
        <span aria-label="Cursor position">Ln 1, Col 1</span>
      </div>

      <div className="flex items-center gap-4">
        <span aria-label="Language mode">TypeScript</span>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          title="Toggle Theme"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <Moon className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Sun className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </footer>
  );
}
