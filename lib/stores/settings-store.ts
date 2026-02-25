import { create } from 'zustand';

/**
 * Setting category types
 */
export type SettingCategory = 'editor' | 'appearance' | 'terminal' | 'files' | 'keyboard';

/**
 * Setting value types
 */
export type SettingType = 'boolean' | 'number' | 'string' | 'select';

/**
 * Select option interface
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Setting interface
 */
export interface Setting {
  /** Unique identifier */
  id: string;
  /** Setting label */
  label: string;
  /** Setting description */
  description: string;
  /** Category */
  category: SettingCategory;
  /** Value type */
  type: SettingType;
  /** Current value */
  value: string | number | boolean;
  /** Default value */
  defaultValue: string | number | boolean;
  /** Options for select type */
  options?: SelectOption[];
  /** Min value for number type */
  min?: number;
  /** Max value for number type */
  max?: number;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: Setting[] = [
  // Editor settings
  {
    id: 'editor.fontSize',
    label: 'Font Size',
    description: 'Controls the font size in pixels',
    category: 'editor',
    type: 'number',
    value: 14,
    defaultValue: 14,
    min: 8,
    max: 32,
  },
  {
    id: 'editor.tabSize',
    label: 'Tab Size',
    description: 'Number of spaces per tab',
    category: 'editor',
    type: 'number',
    value: 2,
    defaultValue: 2,
    min: 1,
    max: 8,
  },
  {
    id: 'editor.wordWrap',
    label: 'Word Wrap',
    description: 'Controls how lines should wrap',
    category: 'editor',
    type: 'select',
    value: 'off',
    defaultValue: 'off',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'On', value: 'on' },
      { label: 'Word Wrap Column', value: 'wordWrapColumn' },
    ],
  },
  {
    id: 'editor.minimap',
    label: 'Minimap',
    description: 'Show minimap overview of the file',
    category: 'editor',
    type: 'boolean',
    value: true,
    defaultValue: true,
  },

  // Appearance settings
  {
    id: 'appearance.theme',
    label: 'Color Theme',
    description: 'Select the color theme for the IDE',
    category: 'appearance',
    type: 'select',
    value: 'dark',
    defaultValue: 'dark',
    options: [
      { label: 'Dark', value: 'dark' },
      { label: 'Light', value: 'light' },
      { label: 'High Contrast', value: 'high-contrast' },
    ],
  },
  {
    id: 'appearance.iconTheme',
    label: 'File Icon Theme',
    description: 'Icon theme for file explorer',
    category: 'appearance',
    type: 'select',
    value: 'default',
    defaultValue: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Minimal', value: 'minimal' },
    ],
  },
  {
    id: 'appearance.activityBarPosition',
    label: 'Activity Bar Position',
    description: 'Position of the activity bar',
    category: 'appearance',
    type: 'select',
    value: 'left',
    defaultValue: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  },

  // Terminal settings
  {
    id: 'terminal.fontSize',
    label: 'Terminal Font Size',
    description: 'Font size for terminal text',
    category: 'terminal',
    type: 'number',
    value: 13,
    defaultValue: 13,
    min: 8,
    max: 24,
  },
  {
    id: 'terminal.cursorStyle',
    label: 'Cursor Style',
    description: 'Style of the terminal cursor',
    category: 'terminal',
    type: 'select',
    value: 'block',
    defaultValue: 'block',
    options: [
      { label: 'Block', value: 'block' },
      { label: 'Underline', value: 'underline' },
      { label: 'Bar', value: 'bar' },
    ],
  },

  // Files settings
  {
    id: 'files.autoSave',
    label: 'Auto Save',
    description: 'Automatically save files after a delay',
    category: 'files',
    type: 'select',
    value: 'afterDelay',
    defaultValue: 'afterDelay',
    options: [
      { label: 'Off', value: 'off' },
      { label: 'After Delay', value: 'afterDelay' },
      { label: 'On Focus Change', value: 'onFocusChange' },
    ],
  },
  {
    id: 'files.trimTrailingWhitespace',
    label: 'Trim Trailing Whitespace',
    description: 'Remove trailing whitespace on save',
    category: 'files',
    type: 'boolean',
    value: false,
    defaultValue: false,
  },

  // Keyboard settings
  {
    id: 'keyboard.dispatch',
    label: 'Keyboard Dispatch',
    description: 'Controls the dispatching logic for keyboard shortcuts',
    category: 'keyboard',
    type: 'select',
    value: 'code',
    defaultValue: 'code',
    options: [
      { label: 'Code', value: 'code' },
      { label: 'Key Code', value: 'keyCode' },
    ],
  },
];

/**
 * Settings store interface
 */
interface SettingsStore {
  settings: Setting[];
  searchQuery: string;
  activeCategory: SettingCategory | 'all';

  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: SettingCategory | 'all') => void;
  updateSetting: (id: string, value: string | number | boolean) => void;
  resetSetting: (id: string) => void;
  resetAllSettings: () => void;
  getFilteredSettings: () => Setting[];
}

/**
 * Settings store
 */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  searchQuery: '',
  activeCategory: 'all',

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setActiveCategory: (category: SettingCategory | 'all') =>
    set({ activeCategory: category }),

  /**
   * Update a setting value
   */
  updateSetting: (id: string, value: string | number | boolean) =>
    set((state) => ({
      settings: state.settings.map((setting) =>
        setting.id === id ? { ...setting, value } : setting
      ),
    })),

  /**
   * Reset a setting to its default value
   */
  resetSetting: (id: string) =>
    set((state) => ({
      settings: state.settings.map((setting) =>
        setting.id === id
          ? { ...setting, value: setting.defaultValue }
          : setting
      ),
    })),

  /**
   * Reset all settings to default values
   */
  resetAllSettings: () =>
    set((state) => ({
      settings: state.settings.map((setting) => ({
        ...setting,
        value: setting.defaultValue,
      })),
    })),

  /**
   * Get filtered settings based on search and category
   */
  getFilteredSettings: () => {
    const { settings, searchQuery, activeCategory } = get();
    const query = searchQuery.toLowerCase().trim();

    return settings.filter((setting) => {
      // Category filter
      const categoryMatch =
        activeCategory === 'all' || setting.category === activeCategory;

      // Search filter (label, description)
      const searchMatch =
        !query ||
        setting.label.toLowerCase().includes(query) ||
        setting.description.toLowerCase().includes(query) ||
        setting.id.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  },
}));
