import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTerminalStore } from '../terminal-store';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Date.now()),
}));

describe('terminal-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { terminals } = useTerminalStore.getState();
    // Close all terminals
    terminals.forEach((t) => {
      useTerminalStore.getState().closeTerminal(t.id);
    });
  });

  describe('createTerminal', () => {
    it('should create a new terminal with default values', () => {
      const { createTerminal, terminals } = useTerminalStore.getState();

      const created = createTerminal();

      expect(created).toBe(true);
      expect(terminals).toHaveLength(1);
      expect(terminals[0]).toMatchObject({
        title: 'Terminal 1',
        cwd: '/project',
        history: [],
        isActive: true,
      });
      expect(terminals[0].id).toBeDefined();
      expect(terminals[0].createdAt).toBeInstanceOf(Date);
    });

    it('should set new terminal as active', () => {
      const { createTerminal, activeTerminalId, terminals } = useTerminalStore.getState();

      createTerminal();

      expect(activeTerminalId).toBe(terminals[0].id);
      expect(terminals[0].isActive).toBe(true);
    });

    it('should increment terminal number in title', () => {
      const { createTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();
      createTerminal();

      expect(terminals[0].title).toBe('Terminal 1');
      expect(terminals[1].title).toBe('Terminal 2');
      expect(terminals[2].title).toBe('Terminal 3');
    });

    it('should not exceed maxTerminals limit', () => {
      const { createTerminal, terminals, maxTerminals } = useTerminalStore.getState();

      // Create max terminals
      for (let i = 0; i < maxTerminals; i++) {
        createTerminal();
      }

      // Try to create one more
      const created = createTerminal();

      expect(created).toBe(false);
      expect(terminals).toHaveLength(maxTerminals);
    });

    it('should deactivate previous terminal when creating new one', () => {
      const { createTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      const firstId = terminals[0].id;
      createTerminal();

      const firstTerminal = terminals.find((t) => t.id === firstId);
      expect(firstTerminal?.isActive).toBe(false);
      expect(terminals[1].isActive).toBe(true);
    });
  });

  describe('closeTerminal', () => {
    it('should remove terminal from list', () => {
      const { createTerminal, closeTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      closeTerminal(terminalId);

      expect(terminals).toHaveLength(0);
    });

    it('should set activeTerminalId to null when closing last terminal', () => {
      const { createTerminal, closeTerminal, terminals, activeTerminalId } =
        useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      closeTerminal(terminalId);

      expect(activeTerminalId).toBeNull();
    });

    it('should activate next terminal when closing active terminal', () => {
      const { createTerminal, closeTerminal, terminals, activeTerminalId } =
        useTerminalStore.getState();

      createTerminal();
      const firstId = terminals[0].id;
      createTerminal();
      const secondId = terminals[1].id;
      createTerminal();

      // Set first as active
      useTerminalStore.getState().setActiveTerminal(firstId);

      // Close first
      closeTerminal(firstId);

      expect(activeTerminalId).toBe(secondId);
    });

    it('should handle closing non-existent terminal', () => {
      const { createTerminal, closeTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      const count = terminals.length;

      closeTerminal('non-existent-id');

      expect(terminals).toHaveLength(count);
    });

    it('should allow creating new terminal after closing', () => {
      const { createTerminal, closeTerminal, terminals, maxTerminals } =
        useTerminalStore.getState();

      // Create max terminals
      for (let i = 0; i < maxTerminals; i++) {
        createTerminal();
      }

      // Close one
      closeTerminal(terminals[0].id);

      // Should be able to create new one
      const created = createTerminal();
      expect(created).toBe(true);
    });
  });

  describe('setActiveTerminal', () => {
    it('should set specified terminal as active', () => {
      const { createTerminal, setActiveTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      const firstId = terminals[0].id;
      setActiveTerminal(firstId);

      expect(terminals[0].isActive).toBe(true);
      expect(terminals[1].isActive).toBe(false);
    });

    it('should update activeTerminalId', () => {
      const { createTerminal, setActiveTerminal, terminals, activeTerminalId } =
        useTerminalStore.getState();

      createTerminal();
      createTerminal();

      const firstId = terminals[0].id;
      setActiveTerminal(firstId);

      expect(activeTerminalId).toBe(firstId);
    });

    it('should deactivate previously active terminal', () => {
      const { createTerminal, setActiveTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      // Second is active by default
      expect(terminals[1].isActive).toBe(true);

      // Activate first
      setActiveTerminal(terminals[0].id);

      expect(terminals[1].isActive).toBe(false);
    });

    it('should handle setting non-existent terminal as active', () => {
      const { createTerminal, setActiveTerminal, activeTerminalId } =
        useTerminalStore.getState();

      createTerminal();
      const currentActiveId = activeTerminalId;

      setActiveTerminal('non-existent-id');

      // Should not change active terminal
      expect(activeTerminalId).toBe(currentActiveId);
    });
  });

  describe('updateTerminalTitle', () => {
    it('should update terminal title', () => {
      const { createTerminal, updateTerminalTitle, terminals } = useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      updateTerminalTitle(terminalId, 'Custom Title');

      expect(terminals[0].title).toBe('Custom Title');
    });

    it('should not affect other terminals', () => {
      const { createTerminal, updateTerminalTitle, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      updateTerminalTitle(terminals[0].id, 'New Title');

      expect(terminals[0].title).toBe('New Title');
      expect(terminals[1].title).toBe('Terminal 2');
    });

    it('should handle updating non-existent terminal', () => {
      const { createTerminal, updateTerminalTitle, terminals } = useTerminalStore.getState();

      createTerminal();
      const originalTitle = terminals[0].title;

      updateTerminalTitle('non-existent-id', 'New Title');

      expect(terminals[0].title).toBe(originalTitle);
    });
  });

  describe('updateTerminalCwd', () => {
    it('should update terminal working directory', () => {
      const { createTerminal, updateTerminalCwd, terminals } = useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      updateTerminalCwd(terminalId, '/new/path');

      expect(terminals[0].cwd).toBe('/new/path');
    });

    it('should not affect other terminals', () => {
      const { createTerminal, updateTerminalCwd, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      updateTerminalCwd(terminals[0].id, '/path1');

      expect(terminals[0].cwd).toBe('/path1');
      expect(terminals[1].cwd).toBe('/project');
    });
  });

  describe('addToHistory', () => {
    it('should add command to terminal history', () => {
      const { createTerminal, addToHistory, terminals } = useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      addToHistory(terminalId, 'ls -la');

      expect(terminals[0].history).toContain('ls -la');
    });

    it('should maintain history order', () => {
      const { createTerminal, addToHistory, terminals } = useTerminalStore.getState();

      createTerminal();
      const terminalId = terminals[0].id;

      addToHistory(terminalId, 'command1');
      addToHistory(terminalId, 'command2');
      addToHistory(terminalId, 'command3');

      expect(terminals[0].history).toEqual(['command1', 'command2', 'command3']);
    });

    it('should not affect other terminals history', () => {
      const { createTerminal, addToHistory, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      addToHistory(terminals[0].id, 'command1');

      expect(terminals[0].history).toHaveLength(1);
      expect(terminals[1].history).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title update', () => {
      const { createTerminal, updateTerminalTitle, terminals } = useTerminalStore.getState();

      createTerminal();
      updateTerminalTitle(terminals[0].id, '');

      expect(terminals[0].title).toBe('');
    });

    it('should handle empty cwd update', () => {
      const { createTerminal, updateTerminalCwd, terminals } = useTerminalStore.getState();

      createTerminal();
      updateTerminalCwd(terminals[0].id, '');

      expect(terminals[0].cwd).toBe('');
    });

    it('should handle rapid create/close operations', () => {
      const { createTerminal, closeTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      const id1 = terminals[0].id;
      closeTerminal(id1);
      createTerminal();
      const id2 = terminals[0].id;
      closeTerminal(id2);
      createTerminal();

      expect(terminals).toHaveLength(1);
    });
  });

  describe('State Consistency', () => {
    it('should maintain exactly one active terminal', () => {
      const { createTerminal, terminals } = useTerminalStore.getState();

      createTerminal();
      createTerminal();
      createTerminal();

      const activeCount = terminals.filter((t) => t.isActive).length;
      expect(activeCount).toBe(1);
    });

    it('should keep activeTerminalId in sync with isActive flag', () => {
      const { createTerminal, terminals, activeTerminalId } = useTerminalStore.getState();

      createTerminal();
      createTerminal();

      const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
      expect(activeTerminal?.isActive).toBe(true);
    });
  });
});
