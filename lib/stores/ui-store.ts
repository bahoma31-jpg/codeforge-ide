import { create } from 'zustand';

export type ActivityBarView =
  | 'explorer'
  | 'search'
  | 'git'
  | 'terminal'
  | 'settings';

export type CodeforgeTheme = 'light' | 'dark' | 'high-contrast';

interface UIState {
  sidebarVisible: boolean;
  panelVisible: boolean;
  activityBarView: ActivityBarView;
  sidebarWidth: number;
  panelHeight: number;
  agentPanelWidth: number;
  theme: CodeforgeTheme;

  toggleSidebar: () => void;
  togglePanel: () => void;
  setActivityBarView: (view: ActivityBarView) => void;
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  setAgentPanelWidth: (width: number) => void;
  setTheme: (theme: CodeforgeTheme) => void;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const useUIStore = create<UIState>((set) => ({
  sidebarVisible: true,
  panelVisible: true,
  activityBarView: 'explorer',
  sidebarWidth: 250,
  panelHeight: 200,
  agentPanelWidth: 380,
  theme: 'dark',

  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  togglePanel: () => set((s) => ({ panelVisible: !s.panelVisible })),
  setActivityBarView: (view) => set({ activityBarView: view }),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: clamp(Math.round(width), 200, 400) }),
  setPanelHeight: (height) =>
    set({ panelHeight: clamp(Math.round(height), 150, 400) }),
  setAgentPanelWidth: (width) =>
    set({ agentPanelWidth: clamp(Math.round(width), 300, 600) }),
  setTheme: (theme) => set({ theme }),
}));
