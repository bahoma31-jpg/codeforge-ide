'use client';

import { useState } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { AlertCircle, Bug, FileText, Terminal, X } from 'lucide-react';

const sections = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'output', icon: FileText, label: 'Output' },
  { id: 'problems', icon: AlertCircle, label: 'Problems' },
  { id: 'debug', icon: Bug, label: 'Debug Console' },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function Panel({ height }: { height: number }) {
  const [active, setActive] = useState<SectionId>('terminal');
  const { togglePanel } = useUIStore();

  return (
    <div
      style={{ height }}
      className="flex h-full flex-col border-t border-border bg-[hsl(var(--cf-panel))]"
    >
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={[
                  'flex items-center gap-2 border-r border-border px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-secondary',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={togglePanel}
          className="p-2 text-muted-foreground hover:text-foreground"
          title="Close Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {active === 'terminal' && (
          <div className="rounded border-2 border-dashed border-muted-foreground/30 p-4">
            <p className="text-sm text-muted-foreground">
              xterm.js Terminal will be integrated here by Agent 6.
            </p>
          </div>
        )}

        {active === 'output' && (
          <p className="text-sm text-muted-foreground">
            Output logs will appear here...
          </p>
        )}

        {active === 'problems' && (
          <p className="text-sm text-muted-foreground">
            Problems will appear here...
          </p>
        )}

        {active === 'debug' && (
          <p className="text-sm text-muted-foreground">
            Debug Console will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
