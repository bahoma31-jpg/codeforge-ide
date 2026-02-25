'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react';
import { TerminalSkeleton } from '@/components/ui/loading-spinner';

// Lazy load terminal emulator (heavy component with xterm.js)
const TerminalEmulator = dynamic(
  () => import('./terminal-emulator'),
  {
    ssr: false,
    loading: () => <TerminalSkeleton />,
  }
);

/**
 * Terminal Panel Component
 * Manages multiple terminal instances with tabs
 */
function TerminalPanel() {
  const {
    terminals,
    activeTerminalId,
    maxTerminals,
    createTerminal,
    closeTerminal,
    setActiveTerminal,
    updateTerminalTitle,
  } = useTerminalStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Create initial terminal on mount
   */
  useEffect(() => {
    if (terminals.length === 0) {
      createTerminal();
    }
  }, []);

  /**
   * Handle creating a new terminal (memoized)
   */
  const handleCreateTerminal = useCallback((): void => {
    const created = createTerminal();
    if (!created) {
      alert(`Maximum ${maxTerminals} terminals allowed`);
    }
  }, [createTerminal, maxTerminals]);

  /**
   * Handle closing a terminal (memoized)
   */
  const handleCloseTerminal = useCallback((id: string): void => {
    closeTerminal(id);
  }, [closeTerminal]);

  /**
   * Start editing terminal title (memoized)
   */
  const startEditing = useCallback((id: string, currentTitle: string): void => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  }, []);

  /**
   * Save edited title (memoized)
   */
  const saveTitle = useCallback((): void => {
    if (editingId && editingTitle.trim()) {
      updateTerminalTitle(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  }, [editingId, editingTitle, updateTerminalTitle]);

  /**
   * Cancel editing (memoized)
   */
  const cancelEditing = useCallback((): void => {
    setEditingId(null);
    setEditingTitle('');
  }, []);

  /**
   * Handle key press in title input (memoized)
   */
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [saveTitle, cancelEditing]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl+Shift+` (new terminal)
      if (e.ctrlKey && e.shiftKey && e.code === 'Backquote') {
        e.preventDefault();
        handleCreateTerminal();
      }

      // Ctrl+Shift+W (close terminal)
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyW') {
        e.preventDefault();
        if (activeTerminalId) {
          handleCloseTerminal(activeTerminalId);
        }
      }

      // Ctrl+Tab (next terminal)
      if (e.ctrlKey && e.code === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = terminals.findIndex((t) => t.id === activeTerminalId);
        if (currentIndex !== -1 && terminals.length > 1) {
          const nextIndex = (currentIndex + 1) % terminals.length;
          setActiveTerminal(terminals[nextIndex].id);
        }
      }

      // Ctrl+Shift+Tab (previous terminal)
      if (e.ctrlKey && e.shiftKey && e.code === 'Tab') {
        e.preventDefault();
        const currentIndex = terminals.findIndex((t) => t.id === activeTerminalId);
        if (currentIndex !== -1 && terminals.length > 1) {
          const prevIndex = currentIndex === 0 ? terminals.length - 1 : currentIndex - 1;
          setActiveTerminal(terminals[prevIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [terminals, activeTerminalId, setActiveTerminal, handleCreateTerminal, handleCloseTerminal]);

  /**
   * Focus input when editing starts
   */
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Memoize active terminal check
  const isAtMaxTerminals = useMemo(
    () => terminals.length >= maxTerminals,
    [terminals.length, maxTerminals]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Terminal tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-[hsl(var(--cf-panel))] px-2 py-1">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={[
              'group flex items-center gap-2 rounded px-3 py-1.5 transition-colors',
              terminal.isActive
                ? 'bg-secondary text-primary'
                : 'text-muted-foreground hover:bg-secondary/50',
            ].join(' ')}
          >
            {/* Terminal icon */}
            <TerminalIcon className="h-3.5 w-3.5 shrink-0" />

            {/* Title (editable on double-click) */}
            {editingId === terminal.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitle}
                className="w-24 rounded border border-border bg-background px-1 py-0 text-xs outline-none focus:border-primary"
              />
            ) : (
              <button
                onClick={() => setActiveTerminal(terminal.id)}
                onDoubleClick={() => startEditing(terminal.id, terminal.title)}
                className="text-xs font-medium"
              >
                {terminal.title}
              </button>
            )}

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTerminal(terminal.id);
              }}
              className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              title="Close Terminal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* New terminal button */}
        <button
          onClick={handleCreateTerminal}
          disabled={isAtMaxTerminals}
          className={[
            'flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors',
            isAtMaxTerminals
              ? 'cursor-not-allowed text-muted-foreground/50'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          ].join(' ')}
          title={`New Terminal (Ctrl+Shift+\`)${isAtMaxTerminals ? ' - Max limit reached' : ''}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* Terminal count indicator */}
        <div className="ml-auto text-xs text-muted-foreground">
          {terminals.length}/{maxTerminals}
        </div>
      </div>

      {/* Active terminal */}
      <div className="min-h-0 flex-1 bg-[hsl(var(--cf-panel))]">
        {activeTerminalId ? (
          <TerminalEmulator key={activeTerminalId} terminalId={activeTerminalId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <TerminalIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No terminal active</p>
              <button
                onClick={handleCreateTerminal}
                className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Terminal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="border-t border-border bg-[hsl(var(--cf-panel))] px-3 py-1">
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Ctrl+Shift+`</kbd> New
          {' • '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Ctrl+Shift+W</kbd> Close
          {' • '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Ctrl+Tab</kbd> Switch
        </p>
      </div>
    </div>
  );
}

// Export memoized component
export default memo(TerminalPanel);
