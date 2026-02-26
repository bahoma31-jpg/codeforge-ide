'use client';

/**
 * CodeForge IDE — Agent Keyboard Shortcuts
 * Global keyboard shortcuts for the agent.
 */

import { useEffect } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';

export function useAgentKeyboard() {
  const { togglePanel, isPanelOpen } = useAgentStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A or Cmd+Shift+A — Toggle agent panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        togglePanel();
      }

      // Escape — Close panel
      if (e.key === 'Escape' && isPanelOpen) {
        const { closePanel } = useAgentStore.getState();
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel, isPanelOpen]);
}
