'use client';

import dynamic from 'next/dynamic';

/**
 * Terminal wrapper using dynamic import to prevent SSR issues with xterm.js.
 * xterm.js accesses DOM APIs that are not available during server-side rendering.
 */
const TerminalPanel = dynamic(() => import('./terminal-panel'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <p className="text-xs text-muted-foreground">Loading terminal...</p>
    </div>
  ),
});

/**
 * Terminal Wrapper Component
 * Entry point for the terminal feature in the IDE panel.
 */
export default function TerminalWrapper() {
  return <TerminalPanel />;
}
