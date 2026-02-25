import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui-store';

describe('ui-store', () => {
  beforeEach(() => {
    // Reset store to default state
    const store = useUIStore.getState();
    store.setSidebarVisible(true);
    store.setPanelVisible(true);
    store.setSidebarWidth(250);
    store.setPanelHeight(200);
  });

  describe('sidebar visibility', () => {
    it('should toggle sidebar visibility', () => {
      const { toggleSidebar, sidebarVisible } = useUIStore.getState();

      const initial = sidebarVisible;
      toggleSidebar();

      expect(useUIStore.getState().sidebarVisible).toBe(!initial);
    });

    it('should set sidebar visibility directly', () => {
      const { setSidebarVisible } = useUIStore.getState();

      setSidebarVisible(false);
      expect(useUIStore.getState().sidebarVisible).toBe(false);

      setSidebarVisible(true);
      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });

    it('should handle multiple toggle operations', () => {
      const { toggleSidebar } = useUIStore.getState();

      const initial = useUIStore.getState().sidebarVisible;
      toggleSidebar();
      toggleSidebar();

      expect(useUIStore.getState().sidebarVisible).toBe(initial);
    });
  });

  describe('panel visibility', () => {
    it('should toggle panel visibility', () => {
      const { togglePanel, panelVisible } = useUIStore.getState();

      const initial = panelVisible;
      togglePanel();

      expect(useUIStore.getState().panelVisible).toBe(!initial);
    });

    it('should set panel visibility directly', () => {
      const { setPanelVisible } = useUIStore.getState();

      setPanelVisible(false);
      expect(useUIStore.getState().panelVisible).toBe(false);

      setPanelVisible(true);
      expect(useUIStore.getState().panelVisible).toBe(true);
    });

    it('should handle multiple toggle operations', () => {
      const { togglePanel } = useUIStore.getState();

      const initial = useUIStore.getState().panelVisible;
      togglePanel();
      togglePanel();

      expect(useUIStore.getState().panelVisible).toBe(initial);
    });
  });

  describe('sidebar width', () => {
    it('should set sidebar width', () => {
      const { setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(300);

      expect(useUIStore.getState().sidebarWidth).toBe(300);
    });

    it('should handle minimum width (200px)', () => {
      const { setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(200);

      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });

    it('should handle maximum width (500px)', () => {
      const { setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(500);

      expect(useUIStore.getState().sidebarWidth).toBe(500);
    });

    it('should handle various width values', () => {
      const { setSidebarWidth } = useUIStore.getState();

      const widths = [200, 250, 300, 350, 400, 450, 500];

      widths.forEach((width) => {
        setSidebarWidth(width);
        expect(useUIStore.getState().sidebarWidth).toBe(width);
      });
    });
  });

  describe('panel height', () => {
    it('should set panel height', () => {
      const { setPanelHeight } = useUIStore.getState();

      setPanelHeight(250);

      expect(useUIStore.getState().panelHeight).toBe(250);
    });

    it('should handle minimum height (150px)', () => {
      const { setPanelHeight } = useUIStore.getState();

      setPanelHeight(150);

      expect(useUIStore.getState().panelHeight).toBe(150);
    });

    it('should handle maximum height (600px)', () => {
      const { setPanelHeight } = useUIStore.getState();

      setPanelHeight(600);

      expect(useUIStore.getState().panelHeight).toBe(600);
    });

    it('should handle various height values', () => {
      const { setPanelHeight } = useUIStore.getState();

      const heights = [150, 200, 250, 300, 350, 400, 500, 600];

      heights.forEach((height) => {
        setPanelHeight(height);
        expect(useUIStore.getState().panelHeight).toBe(height);
      });
    });
  });

  describe('combined state operations', () => {
    it('should handle sidebar and panel visibility together', () => {
      const { toggleSidebar, togglePanel } = useUIStore.getState();

      toggleSidebar();
      togglePanel();

      const { sidebarVisible, panelVisible } = useUIStore.getState();

      expect(sidebarVisible).toBe(false);
      expect(panelVisible).toBe(false);
    });

    it('should handle setting all dimensions at once', () => {
      const { setSidebarWidth, setPanelHeight } = useUIStore.getState();

      setSidebarWidth(350);
      setPanelHeight(300);

      const { sidebarWidth, panelHeight } = useUIStore.getState();

      expect(sidebarWidth).toBe(350);
      expect(panelHeight).toBe(300);
    });

    it('should maintain independent state for visibility and dimensions', () => {
      const { toggleSidebar, setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(400);
      toggleSidebar();

      const { sidebarVisible, sidebarWidth } = useUIStore.getState();

      expect(sidebarVisible).toBe(false);
      expect(sidebarWidth).toBe(400);
    });
  });

  describe('default state', () => {
    it('should have correct default sidebar visibility', () => {
      const { sidebarVisible } = useUIStore.getState();
      expect(typeof sidebarVisible).toBe('boolean');
    });

    it('should have correct default panel visibility', () => {
      const { panelVisible } = useUIStore.getState();
      expect(typeof panelVisible).toBe('boolean');
    });

    it('should have correct default sidebar width', () => {
      const { sidebarWidth } = useUIStore.getState();
      expect(sidebarWidth).toBeGreaterThanOrEqual(200);
      expect(sidebarWidth).toBeLessThanOrEqual(500);
    });

    it('should have correct default panel height', () => {
      const { panelHeight } = useUIStore.getState();
      expect(panelHeight).toBeGreaterThanOrEqual(150);
      expect(panelHeight).toBeLessThanOrEqual(600);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid toggle operations', () => {
      const { toggleSidebar, togglePanel } = useUIStore.getState();

      for (let i = 0; i < 10; i++) {
        toggleSidebar();
        togglePanel();
      }

      const { sidebarVisible, panelVisible } = useUIStore.getState();

      expect(typeof sidebarVisible).toBe('boolean');
      expect(typeof panelVisible).toBe('boolean');
    });

    it('should handle setting same visibility value multiple times', () => {
      const { setSidebarVisible } = useUIStore.getState();

      setSidebarVisible(true);
      setSidebarVisible(true);
      setSidebarVisible(true);

      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });

    it('should handle setting same dimension value multiple times', () => {
      const { setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(300);
      setSidebarWidth(300);
      setSidebarWidth(300);

      expect(useUIStore.getState().sidebarWidth).toBe(300);
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple reads', () => {
      const { setSidebarWidth, setPanelHeight } = useUIStore.getState();

      setSidebarWidth(350);
      setPanelHeight(280);

      // Read state multiple times
      for (let i = 0; i < 5; i++) {
        const { sidebarWidth, panelHeight } = useUIStore.getState();
        expect(sidebarWidth).toBe(350);
        expect(panelHeight).toBe(280);
      }
    });

    it('should maintain visibility state after dimension changes', () => {
      const { toggleSidebar, setSidebarWidth } = useUIStore.getState();

      toggleSidebar();
      const visibleBefore = useUIStore.getState().sidebarVisible;

      setSidebarWidth(400);

      const visibleAfter = useUIStore.getState().sidebarVisible;
      expect(visibleAfter).toBe(visibleBefore);
    });
  });

  describe('state transitions', () => {
    it('should transition between visible and hidden states', () => {
      const { setSidebarVisible } = useUIStore.getState();

      setSidebarVisible(true);
      expect(useUIStore.getState().sidebarVisible).toBe(true);

      setSidebarVisible(false);
      expect(useUIStore.getState().sidebarVisible).toBe(false);

      setSidebarVisible(true);
      expect(useUIStore.getState().sidebarVisible).toBe(true);
    });

    it('should transition between different dimension values', () => {
      const { setSidebarWidth } = useUIStore.getState();

      setSidebarWidth(200);
      expect(useUIStore.getState().sidebarWidth).toBe(200);

      setSidebarWidth(350);
      expect(useUIStore.getState().sidebarWidth).toBe(350);

      setSidebarWidth(500);
      expect(useUIStore.getState().sidebarWidth).toBe(500);
    });
  });
});
