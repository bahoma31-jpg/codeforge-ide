'use client';

import { Files, GitBranch, Search, Settings, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const activities = [
  { id: 'explorer', icon: Files, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
  { id: 'search', icon: Search, label: 'Search', shortcut: 'Ctrl+Shift+F' },
  { id: 'git', icon: GitBranch, label: 'Source Control', shortcut: 'Ctrl+Shift+G' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', shortcut: 'Ctrl+`' },
  { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'Ctrl+,' },
];

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <nav
      role="navigation"
      aria-label="Primary navigation"
      className="w-12 bg-muted border-r flex flex-col items-center py-2 space-y-1"
    >
      {activities.map((activity) => {
        const Icon = activity.icon;
        const isActive = activeView === activity.id;

        return (
          <button
            key={activity.id}
            onClick={() => onViewChange(activity.id)}
            aria-label={activity.label}
            aria-keyshortcuts={activity.shortcut}
            aria-pressed={isActive}
            title={`${activity.label} (${activity.shortcut})`}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg',
              'hover:bg-accent transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive && 'bg-accent text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{activity.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
