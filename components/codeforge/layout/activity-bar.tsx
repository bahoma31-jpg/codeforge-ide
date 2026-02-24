'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { Files, Search, GitBranch, Package, Settings } from 'lucide-react';

const views = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
  { id: 'settings', icon: Settings, label: 'Settings' },
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
    <aside className="flex w-12 flex-col items-center gap-2 border-r border-border bg-[hsl(var(--cf-activitybar))] py-3">
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
            ].join(' ')}
            title={view.label}
            aria-pressed={active}
          >
            <ActiveIcon className="h-6 w-6" />
          </button>
        );
      })}
    </aside>
  );
}
