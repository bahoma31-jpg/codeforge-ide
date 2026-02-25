/**
 * CodeForge IDE - Terminal Panel
 * Phase 5: Terminal Emulator Integration
 * Agent 6: Terminal Emulator Engineer
 *
 * Wrapper component that manages multiple terminal instances with a tab bar.
 * Supports creating, switching, closing, and renaming terminal instances.
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Terminal } from 'lucide-react';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import TerminalEmulator from './terminal-emulator';

/**
 * Maximum number of terminal instances allowed
 */
const MAX_INSTANCES = 5;

/**
 * Terminal Panel Component
 * Manages multiple terminal instances with tab-based navigation.
 */
export default function TerminalPanel(): JSX.Element {
  const {
    instances,
    activeInstanceId,
    createInstance,
    removeInstance,
    setActiveInstance,
    renameInstance,
  } = useTerminalStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  /**
   * Auto-create first instance on mount if none exist
   */
  useEffect(() => {
    if (instances.length === 0) {
      createInstance();
    }
  }, [instances.length, createInstance]);

  /**
   * Handles creating a new terminal instance
   */
  const handleCreateInstance = () => {
    if (instances.length >= MAX_INSTANCES) {
      console.warn(`Maximum ${MAX_INSTANCES} terminal instances reached`);
      return;
    }
    createInstance();
  };

  /**
   * Handles closing a terminal instance
   */
  const handleCloseInstance = (
    e: React.MouseEvent,
    instanceId: string
  ) => {
    e.stopPropagation();
    removeInstance(instanceId);
  };

  /**
   * Handles switching to a terminal instance
   */
  const handleSwitchInstance = (instanceId: string) => {
    if (editingTabId) return; // Don't switch while editing
    setActiveInstance(instanceId);
  };

  /**
   * Handles double-click to rename a terminal
   */
  const handleDoubleClick = (
    e: React.MouseEvent,
    instanceId: string,
    currentName: string
  ) => {
    e.stopPropagation();
    setEditingTabId(instanceId);
    setEditingName(currentName);
  };

  /**
   * Handles input change while renaming
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  /**
   * Handles confirming rename
   */
  const handleConfirmRename = () => {
    if (editingTabId && editingName.trim()) {
      renameInstance(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  /**
   * Handles canceling rename
   */
  const handleCancelRename = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  /**
   * Handles key press while renaming
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--cf-panel))]">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-[hsl(var(--cf-panel))]">
        {/* Terminal Tabs */}
        {instances.map((instance) => {
          const isActive = instance.id === activeInstanceId;
          const isEditing = editingTabId === instance.id;

          return (
            <div
              key={instance.id}
              onClick={() => handleSwitchInstance(instance.id)}
              className={[
                'group flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors',
                isActive
                  ? 'bg-secondary text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              ].join(' ')}
            >
              <Terminal className="h-3 w-3 flex-shrink-0" />

              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={handleNameChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleConfirmRename}
                  className="bg-transparent outline-none border-b border-primary w-24 text-xs"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) =>
                    handleDoubleClick(e, instance.id, instance.name)
                  }
                  className="select-none"
                >
                  {instance.name}
                </span>
              )}

              {/* Close button (appears on hover) */}
              <button
                onClick={(e) => handleCloseInstance(e, instance.id)}
                className={[
                  'p-0.5 rounded hover:bg-secondary transition-opacity',
                  isActive || instances.length === 1
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                ].join(' ')}
                title="Close terminal"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* New Terminal Button */}
        <button
          onClick={handleCreateInstance}
          disabled={instances.length >= MAX_INSTANCES}
          className={[
            'p-1 rounded hover:bg-secondary transition-colors',
            instances.length >= MAX_INSTANCES
              ? 'opacity-50 cursor-not-allowed text-muted-foreground/50'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          title={
            instances.length >= MAX_INSTANCES
              ? `Maximum ${MAX_INSTANCES} terminals reached`
              : 'New terminal'
          }
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 min-h-0 relative">
        {instances.map((instance) => (
          <div
            key={instance.id}
            className="absolute inset-0"
            style={{
              display: instance.id === activeInstanceId ? 'block' : 'none',
            }}
          >
            <TerminalEmulator
              instanceId={instance.id}
              isVisible={instance.id === activeInstanceId}
            />
          </div>
        ))}

        {/* Fallback message if no instances */}
        {instances.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              No terminal instances. Click + to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
