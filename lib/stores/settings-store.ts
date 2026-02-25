import { create } from 'zustand';

/** Editor settings */
export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  cursorStyle: 'line' | 'block' | 'underline';
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
}

/** Theme settings */
export interface ThemeSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
}

/** Terminal settings */
export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  shell: string;
  cursorBlink: boolean;
}

/** All application settings */
export interface AppSettings {
  editor: EditorSettings;
  theme: ThemeSettings;
  terminal: TerminalSettings;
}

/** Settings store interface */
export interface SettingsStore {
  settings: AppSettings;
  isDirty: boolean;

  updateEditorSettings: (partial: Partial<EditorSettings>) => void;
  updateThemeSettings: (partial: Partial<ThemeSettings>) => void;
  updateTerminalSettings: (partial: Partial<TerminalSettings>) => void;
  resetToDefaults: () => void;
  markClean: () => void;
}

/** Default settings */
export const DEFAULT_SETTINGS: AppSettings = {
  editor: {
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on',
    cursorStyle: 'line',
    autoSave: true,
    autoSaveDelay: 1000,
    formatOnSave: true,
    bracketPairColorization: true,
  },
  theme: {
    theme: 'dark',
    accentColor: '#569CD6',
  },
  terminal: {
    fontSize: 13,
    fontFamily: "'Fira Code', monospace",
    shell: '/bin/bash',
    cursorBlink: true,
  },
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: { ...DEFAULT_SETTINGS },
  isDirty: false,

  updateEditorSettings: (partial: Partial<EditorSettings>) =>
    set((state) => ({
      settings: {
        ...state.settings,
        editor: { ...state.settings.editor, ...partial },
      },
      isDirty: true,
    })),

  updateThemeSettings: (partial: Partial<ThemeSettings>) =>
    set((state) => ({
      settings: {
        ...state.settings,
        theme: { ...state.settings.theme, ...partial },
      },
      isDirty: true,
    })),

  updateTerminalSettings: (partial: Partial<TerminalSettings>) =>
    set((state) => ({
      settings: {
        ...state.settings,
        terminal: { ...state.settings.terminal, ...partial },
      },
      isDirty: true,
    })),

  resetToDefaults: () =>
    set({
      settings: { ...DEFAULT_SETTINGS },
      isDirty: false,
    }),

  markClean: () => set({ isDirty: false }),
}));
