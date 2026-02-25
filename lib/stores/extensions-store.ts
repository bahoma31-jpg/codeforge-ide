import { create } from 'zustand';

/**
 * Extension category types
 */
export type ExtensionCategory = 'language' | 'theme' | 'formatter' | 'linter' | 'utility';

/**
 * Extension interface
 */
export interface Extension {
  /** Unique identifier */
  id: string;
  /** Extension name */
  name: string;
  /** Description */
  description: string;
  /** Publisher name */
  publisher: string;
  /** Version string */
  version: string;
  /** Category */
  category: ExtensionCategory;
  /** Whether extension is enabled */
  isEnabled: boolean;
  /** Whether extension is built-in (cannot be uninstalled) */
  isBuiltIn: boolean;
  /** Lucide icon name */
  icon: string;
  /** Download count (display only) */
  downloads: number;
  /** Rating (1-5) */
  rating: number;
}

/**
 * Default built-in extensions
 */
const DEFAULT_EXTENSIONS: Extension[] = [
  {
    id: 'ext-typescript',
    name: 'TypeScript Language',
    description: 'TypeScript and JavaScript language support with IntelliSense',
    publisher: 'CodeForge',
    version: '5.4.0',
    category: 'language',
    isEnabled: true,
    isBuiltIn: true,
    icon: 'FileCode2',
    downloads: 45200000,
    rating: 4.9,
  },
  {
    id: 'ext-python',
    name: 'Python',
    description: 'Python language support with linting and debugging',
    publisher: 'CodeForge',
    version: '2024.1.0',
    category: 'language',
    isEnabled: true,
    isBuiltIn: true,
    icon: 'FileCode',
    downloads: 38500000,
    rating: 4.8,
  },
  {
    id: 'ext-html-css',
    name: 'HTML & CSS',
    description: 'HTML and CSS language support with Emmet abbreviations',
    publisher: 'CodeForge',
    version: '1.9.0',
    category: 'language',
    isEnabled: true,
    isBuiltIn: true,
    icon: 'Globe',
    downloads: 32100000,
    rating: 4.7,
  },
  {
    id: 'ext-prettier',
    name: 'Prettier',
    description: 'Opinionated code formatter supporting multiple languages',
    publisher: 'Prettier',
    version: '3.2.0',
    category: 'formatter',
    isEnabled: true,
    isBuiltIn: false,
    icon: 'Sparkles',
    downloads: 28700000,
    rating: 4.8,
  },
  {
    id: 'ext-eslint',
    name: 'ESLint',
    description: 'Integrates ESLint into the editor for JavaScript and TypeScript',
    publisher: 'Microsoft',
    version: '3.0.5',
    category: 'linter',
    isEnabled: true,
    isBuiltIn: false,
    icon: 'ShieldCheck',
    downloads: 25300000,
    rating: 4.6,
  },
  {
    id: 'ext-dark-theme',
    name: 'CodeForge Dark+',
    description: 'Default dark color theme for CodeForge IDE',
    publisher: 'CodeForge',
    version: '1.0.0',
    category: 'theme',
    isEnabled: true,
    isBuiltIn: true,
    icon: 'Palette',
    downloads: 20000000,
    rating: 4.9,
  },
  {
    id: 'ext-git-lens',
    name: 'GitLens',
    description: 'Supercharge Git — visualize blame, history, and more',
    publisher: 'GitKraken',
    version: '14.8.0',
    category: 'utility',
    isEnabled: false,
    isBuiltIn: false,
    icon: 'GitBranch',
    downloads: 19500000,
    rating: 4.7,
  },
  {
    id: 'ext-bracket-pair',
    name: 'Bracket Pair Colorizer',
    description: 'Colorize matching brackets for better readability',
    publisher: 'CodeForge',
    version: '2.0.0',
    category: 'utility',
    isEnabled: true,
    isBuiltIn: true,
    icon: 'Braces',
    downloads: 15200000,
    rating: 4.5,
  },
  {
    id: 'ext-auto-rename',
    name: 'Auto Rename Tag',
    description: 'Automatically rename paired HTML/XML tags',
    publisher: 'Jun Han',
    version: '0.1.10',
    category: 'utility',
    isEnabled: false,
    isBuiltIn: false,
    icon: 'Tags',
    downloads: 12800000,
    rating: 4.4,
  },
  {
    id: 'ext-tailwind',
    name: 'Tailwind CSS IntelliSense',
    description: 'Intelligent Tailwind CSS tooling with autocomplete and linting',
    publisher: 'Tailwind Labs',
    version: '0.12.0',
    category: 'utility',
    isEnabled: true,
    isBuiltIn: false,
    icon: 'Wind',
    downloads: 10400000,
    rating: 4.8,
  },
];

/**
 * Extensions store interface
 */
interface ExtensionsStore {
  /** All extensions */
  extensions: Extension[];
  /** Search query */
  searchQuery: string;
  /** Active category filter */
  activeCategory: ExtensionCategory | 'all';

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: ExtensionCategory | 'all') => void;
  toggleExtension: (id: string) => void;
  installExtension: (id: string) => void;
  uninstallExtension: (id: string) => void;
  getFilteredExtensions: () => Extension[];
}

/**
 * Extensions store
 */
export const useExtensionsStore = create<ExtensionsStore>((set, get) => ({
  extensions: DEFAULT_EXTENSIONS,
  searchQuery: '',
  activeCategory: 'all',

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setActiveCategory: (category: ExtensionCategory | 'all') =>
    set({ activeCategory: category }),

  /**
   * Toggle extension enabled state
   */
  toggleExtension: (id: string) =>
    set((state) => ({
      extensions: state.extensions.map((ext) =>
        ext.id === id ? { ...ext, isEnabled: !ext.isEnabled } : ext
      ),
    })),

  /**
   * Install (enable) an extension
   */
  installExtension: (id: string) =>
    set((state) => ({
      extensions: state.extensions.map((ext) =>
        ext.id === id ? { ...ext, isEnabled: true } : ext
      ),
    })),

  /**
   * Uninstall (disable) an extension if not built-in
   */
  uninstallExtension: (id: string) =>
    set((state) => ({
      extensions: state.extensions.map((ext) =>
        ext.id === id && !ext.isBuiltIn ? { ...ext, isEnabled: false } : ext
      ),
    })),

  /**
   * Get filtered extensions based on search and category
   */
  getFilteredExtensions: () => {
    const { extensions, searchQuery, activeCategory } = get();
    const query = searchQuery.toLowerCase().trim();

    return extensions.filter((ext) => {
      // Category filter
      const categoryMatch =
        activeCategory === 'all' || ext.category === activeCategory;

      // Search filter (name, description, publisher)
      const searchMatch =
        !query ||
        ext.name.toLowerCase().includes(query) ||
        ext.description.toLowerCase().includes(query) ||
        ext.publisher.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  },
}));
