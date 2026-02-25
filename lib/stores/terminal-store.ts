import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

/**
 * Terminal instance interface
 */
export interface TerminalInstance {
  /** Unique identifier */
  id: string;
  /** Terminal title (editable) */
  title: string;
  /** Current working directory */
  cwd: string;
  /** Command history */
  history: string[];
  /** Whether this terminal is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Terminal store interface
 */
interface TerminalStore {
  /** Array of terminal instances */
  terminals: TerminalInstance[];
  /** ID of the currently active terminal */
  activeTerminalId: string | null;
  /** Maximum number of terminals allowed */
  maxTerminals: number;

  // Actions
  createTerminal: () => boolean;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  updateTerminalTitle: (id: string, title: string) => void;
  updateTerminalCwd: (id: string, cwd: string) => void;
  addToHistory: (id: string, command: string) => void;
  getActiveTerminal: () => TerminalInstance | null;
}

/**
 * Terminal store
 * Manages up to 5 concurrent terminal instances
 */
export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminals: [],
  activeTerminalId: null,
  maxTerminals: 5,

  /**
   * Create a new terminal instance
   * @returns true if created successfully, false if max limit reached
   */
  createTerminal: () => {
    const { terminals, maxTerminals } = get();

    // Check max limit
    if (terminals.length >= maxTerminals) {
      console.warn(`Cannot create more than ${maxTerminals} terminals`);
      return false;
    }

    const id = uuidv4();
    const newTerminal: TerminalInstance = {
      id,
      title: `Terminal ${terminals.length + 1}`,
      cwd: '/',
      history: [],
      isActive: true,
      createdAt: new Date(),
    };

    set((state) => ({
      terminals: [
        ...state.terminals.map((t) => ({ ...t, isActive: false })),
        newTerminal,
      ],
      activeTerminalId: id,
    }));

    return true;
  },

  /**
   * Close a terminal instance
   * @param id - Terminal ID to close
   */
  closeTerminal: (id: string) => {
    set((state) => {
      const filtered = state.terminals.filter((t) => t.id !== id);

      // If closing the active terminal, activate the last remaining one
      let newActiveId = state.activeTerminalId;
      if (state.activeTerminalId === id && filtered.length > 0) {
        newActiveId = filtered[filtered.length - 1].id;
      } else if (filtered.length === 0) {
        newActiveId = null;
      }

      return {
        terminals: filtered.map((t) => ({
          ...t,
          isActive: t.id === newActiveId,
        })),
        activeTerminalId: newActiveId,
      };
    });
  },

  /**
   * Set the active terminal
   * @param id - Terminal ID to activate
   */
  setActiveTerminal: (id: string) => {
    set((state) => ({
      terminals: state.terminals.map((t) => ({
        ...t,
        isActive: t.id === id,
      })),
      activeTerminalId: id,
    }));
  },

  /**
   * Update a terminal's title
   * @param id - Terminal ID
   * @param title - New title
   */
  updateTerminalTitle: (id: string, title: string) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, title } : t
      ),
    }));
  },

  /**
   * Update a terminal's current working directory
   * @param id - Terminal ID
   * @param cwd - New current working directory
   */
  updateTerminalCwd: (id: string, cwd: string) => {
    set((state) => ({
      terminals: state.terminals.map((t) => (t.id === id ? { ...t, cwd } : t)),
    }));
  },

  /**
   * Add a command to terminal's history
   * @param id - Terminal ID
   * @param command - Command to add
   */
  addToHistory: (id: string, command: string) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, history: [...t.history, command] } : t
      ),
    }));
  },

  /**
   * Get the currently active terminal
   * @returns Active terminal instance or null
   */
  getActiveTerminal: () => {
    const { terminals, activeTerminalId } = get();
    return terminals.find((t) => t.id === activeTerminalId) ?? null;
  },
}));
