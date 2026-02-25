'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { Files, Search, GitBranch, Package, Settings } from 'lucide-react';

const views = [
  { id: 'explorer', icon: Files, label: 'Explorer', shortcut: 'Control+Shift+E' },
  { id: 'search', icon: Search, label: 'Search', shortcut: 'Control+Shift+F' },
  { id: 'git', icon: GitBranch, label: 'Source Control', shortcut: 'Control+Shift+G' },
  { id: 'extensions', icon: Package, label: 'Extensions', shortcut: 'Control+Shift+X' },
  { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'Control+,' },
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
    <aside 
      role="navigation" 
      aria-label="Main navigation"
      className="flex w-12 flex-col items-center gap-2 border-r border-border bg-[hsl(var(--cf-activitybar))] py-3"
    >
      {views.map((view) => {
        const ActiveIcon = view.icon;
        const active = activityBarView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onClick(view.id)}
            className={[
              'rounded p-2 transition-colors',
              'hover:bg-secondary',
              active ? 'bg-secondary text-primary' : 'text-muted-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            ].join(' ')}
            title={view.label}
            aria-label={`${view.label} (${view.shortcut.replace('Control', 'Ctrl')})`}
            aria-keyshortcuts={view.shortcut}
            aria-pressed={active}
            aria-controls={active ? 'sidebar-content' : undefined}
            aria-expanded={active && sidebarVisible}
          >
            <ActiveIcon className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">{view.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
