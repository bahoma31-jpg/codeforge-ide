/**
 * CodeForge IDE - Terminal Store
 * Phase 5: Terminal Emulator Integration
 * Agent 6: Terminal Emulator Engineer
 *
 * Zustand store for managing multiple terminal instances.
 * Supports up to 5 concurrent terminal instances with auto-switching logic.
 */

import { create } from 'zustand';

/**
 * Represents a single terminal instance
 */
export interface TerminalInstance {
  /** Unique identifier for the terminal instance */
  id: string;
  /** Display name (e.g., "Terminal 1", "Terminal 2") */
  name: string;
  /** Whether this is the currently active terminal */
  isActive: boolean;
}

/**
 * Terminal store state and actions
 */
interface TerminalStore {
  /** Array of all terminal instances */
  instances: TerminalInstance[];
  /** ID of the currently active terminal instance */
  activeInstanceId: string | null;

  // Actions
  /**
   * Creates a new terminal instance.
   * Maximum 5 instances allowed.
   * @returns The ID of the newly created instance
   */
  createInstance: () => string;

  /**
   * Removes a terminal instance by ID.
   * If removing the active instance, auto-switches to adjacent instance.
   * If removing the last instance, auto-creates a new "Terminal 1".
   * @param id - The instance ID to remove
   */
  removeInstance: (id: string) => void;

  /**
   * Sets the active terminal instance.
   * @param id - The instance ID to activate
   */
  setActiveInstance: (id: string) => void;

  /**
   * Renames a terminal instance.
   * @param id - The instance ID to rename
   * @param name - The new name
   */
  renameInstance: (id: string, name: string) => void;
}

/**
 * Maximum number of terminal instances allowed
 */
const MAX_INSTANCES = 5;

/**
 * Generates a unique ID for a terminal instance
 */
const generateId = (): string => {
  return `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generates a default name for a terminal instance based on count
 * @param count - The instance count (1-based)
 */
const generateDefaultName = (count: number): string => {
  return `Terminal ${count}`;
};

/**
 * Terminal store implementation
 */
export const useTerminalStore = create<TerminalStore>((set, get) => ({
  instances: [],
  activeInstanceId: null,

  createInstance: () => {
    const { instances } = get();

    // Enforce maximum instance limit
    if (instances.length >= MAX_INSTANCES) {
      console.warn(`Maximum ${MAX_INSTANCES} terminal instances reached`);
      return instances[instances.length - 1].id;
    }

    // Generate new instance
    const newId = generateId();
    const newInstance: TerminalInstance = {
      id: newId,
      name: generateDefaultName(instances.length + 1),
      isActive: true,
    };

    // Deactivate all other instances
    const updatedInstances = instances.map((inst) => ({
      ...inst,
      isActive: false,
    }));

    set({
      instances: [...updatedInstances, newInstance],
      activeInstanceId: newId,
    });

    return newId;
  },

  removeInstance: (id: string) => {
    const { instances, activeInstanceId } = get();

    // Find the instance to remove
    const indexToRemove = instances.findIndex((inst) => inst.id === id);
    if (indexToRemove === -1) {
      console.warn(`Terminal instance ${id} not found`);
      return;
    }

    // Remove the instance
    const updatedInstances = instances.filter((inst) => inst.id !== id);

    // If removing the last instance, auto-create a new one
    if (updatedInstances.length === 0) {
      const newId = generateId();
      const newInstance: TerminalInstance = {
        id: newId,
        name: generateDefaultName(1),
        isActive: true,
      };

      set({
        instances: [newInstance],
        activeInstanceId: newId,
      });
      return;
    }

    // If removing the active instance, switch to adjacent instance
    let newActiveId = activeInstanceId;
    if (id === activeInstanceId) {
      // Try to switch to the next instance, or previous if last
      const newActiveIndex = indexToRemove < updatedInstances.length
        ? indexToRemove
        : updatedInstances.length - 1;

      newActiveId = updatedInstances[newActiveIndex].id;

      // Update active state
      updatedInstances.forEach((inst, idx) => {
        inst.isActive = idx === newActiveIndex;
      });
    }

    set({
      instances: updatedInstances,
      activeInstanceId: newActiveId,
    });
  },

  setActiveInstance: (id: string) => {
    const { instances } = get();

    // Verify instance exists
    const targetInstance = instances.find((inst) => inst.id === id);
    if (!targetInstance) {
      console.warn(`Terminal instance ${id} not found`);
      return;
    }

    // Update active state
    const updatedInstances = instances.map((inst) => ({
      ...inst,
      isActive: inst.id === id,
    }));

    set({
      instances: updatedInstances,
      activeInstanceId: id,
    });
  },

  renameInstance: (id: string, name: string) => {
    const { instances } = get();

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      console.warn('Terminal name cannot be empty');
      return;
    }

    // Update instance name
    const updatedInstances = instances.map((inst) =>
      inst.id === id ? { ...inst, name: trimmedName } : inst
    );

    set({ instances: updatedInstances });
  },
}));
