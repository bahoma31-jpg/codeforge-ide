'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { useGitStore } from '@/lib/stores/git-store';
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
  const { status } = useGitStore();

  // Calculate total changes for git badge
  const changeCount =
    status.modified.length + status.added.length + status.deleted.length;

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
        const isGit = view.id === 'git';
        const showBadge = isGit && changeCount > 0;

        return (
          <button
            key={view.id}
            onClick={() => onClick(view.id)}
            className={[
              'relative rounded p-2 transition-colors',
              'hover:bg-secondary',
              active ? 'bg-secondary text-primary' : 'text-muted-foreground',
            ].join(' ')}
            title={view.label}
            aria-pressed={active}
          >
            <ActiveIcon className="h-6 w-6" />

            {/* Badge for git icon */}
            {showBadge && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {changeCount > 9 ? '9+' : changeCount}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
