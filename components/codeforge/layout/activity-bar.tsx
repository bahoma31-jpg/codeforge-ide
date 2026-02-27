/**
 * CodeForge IDE - Activity Bar v2.0
 * Main navigation sidebar with view toggle buttons.
 * Fixed to use correct ui-store property names.
 */

'use client';

import {
  Files,
  Search,
  GitBranch,
  Terminal,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type ActivityBarView } from '@/lib/stores/ui-store';
import { useGitStore } from '@/lib/stores/git-store';

const views: {
  id: ActivityBarView;
  icon: React.ElementType;
  label: string;
}[] = [
  { id: 'explorer', icon: Files, label: 'المستكشف' },
  { id: 'search', icon: Search, label: 'البحث' },
  { id: 'git', icon: GitBranch, label: 'التحكم بالمصدر' },
  { id: 'terminal', icon: Terminal, label: 'الطرفية' },
  { id: 'settings', icon: Settings, label: 'الإعدادات' },
];

export default function ActivityBar() {
  // Use the REAL store property names
  const { activityBarView, setActivityBarView, sidebarVisible, toggleSidebar } =
    useUIStore();
  const { changes } = useGitStore();
  const changeCount = changes.length;

  const handleClick = (viewId: ActivityBarView) => {
    if (activityBarView === viewId && sidebarVisible) {
      // Same view clicked while open → close sidebar
      toggleSidebar();
    } else {
      // Different view or sidebar closed → switch view and open
      setActivityBarView(viewId);
      if (!sidebarVisible) {
        toggleSidebar();
      }
    }
  };

  return (
    <div
      className="flex w-12 flex-col items-center border-r bg-[hsl(var(--cf-sidebar))] py-2"
      role="toolbar"
      aria-label="Activity Bar"
      aria-orientation="vertical"
    >
      {views.map((view) => {
        const isActive = activityBarView === view.id && sidebarVisible;
        return (
          <button
            key={view.id}
            onClick={() => handleClick(view.id)}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-md mb-1',
              'transition-colors duration-150',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
            aria-label={view.label}
            aria-pressed={isActive}
            role="button"
            tabIndex={0}
            title={view.label}
          >
            <view.icon className="h-5 w-5" />
            {/* Git change count badge */}
            {view.id === 'git' && changeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {changeCount > 99 ? '99+' : changeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
