'use client';

import dynamic from 'next/dynamic';

/**
 * Terminal Wrapper Component
 * SSR-safe wrapper for terminal panel using dynamic import
 * 
 * @remarks
 * Terminal components use browser-only APIs (xterm.js),
 * so we disable SSR to avoid hydration errors
 */
const TerminalPanel = dynamic(() => import('./terminal-panel'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[hsl(var(--cf-panel))]">
      <div className="text-center">
        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading terminal...</p>
      </div>
    </div>
  ),
});

/**
 * Export SSR-safe terminal wrapper
 */
export default function TerminalWrapper() {
  return <TerminalPanel />;
}
