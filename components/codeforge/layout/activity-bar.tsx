'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { Files, Search, GitBranch, Terminal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const views = [
  { id: 'explorer', icon: Files, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
  { id: 'search', icon: Search, label: 'Search', shortcut: 'Ctrl+Shift+F' },
  { id: 'git', icon: GitBranch, label: 'Source Control', shortcut: 'Ctrl+Shift+G' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', shortcut: 'Ctrl+`' },
  { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'Ctrl+,' },
] as const;

export default function ActivityBar() {
  const { activityBarView, setActivityBarView, sidebarVisible, toggleSidebar } =
    useUIStore();

  const onClick = (id: (typeof views)[number]['id']) => {
    if (activityBarView === id) {
      toggleSidebar();
      return;
    }
    if (!sidebarVisible) toggleSidebar();
    setActivityBarView(id);
  };

  return (
    <nav
      role="navigation"
      aria-label="Primary navigation"
      className="flex w-12 flex-col items-center gap-2 border-r border-border bg-[hsl(var(--cf-activitybar))] py-3"
    >
      {views.map((view) => {
        const Icon = view.icon;
        const active = activityBarView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onClick(view.id)}
            aria-label={view.label}
            aria-keyshortcuts={view.shortcut}
            aria-pressed={active}
            title={`${view.label} (${view.shortcut})`}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg',
              'hover:bg-secondary transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active && 'bg-secondary text-primary'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{view.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
