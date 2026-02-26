'use client';

import { Suspense } from 'react';
import TerminalSkeleton from './terminal-skeleton';

/**
 * TerminalWrapper — lazy-loads the terminal emulator.
 * Currently renders a placeholder until xterm.js is integrated.
 */
export default function TerminalWrapper() {
  return (
    <Suspense fallback={<TerminalSkeleton />}>
      <div className="h-full bg-muted animate-pulse p-4 space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-32" />
        <div className="h-4 bg-muted-foreground/20 rounded w-48" />
        <div className="h-4 bg-muted-foreground/20 rounded w-64" />
        <p className="text-sm text-muted-foreground mt-4">
          Terminal emulator will be integrated here.
        </p>
      </div>
    </Suspense>
  );
}
