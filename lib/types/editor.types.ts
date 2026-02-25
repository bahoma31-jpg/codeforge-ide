export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
  scrollPosition?: {
    scrollTop: number;
    scrollLeft: number;
  };
  viewState?: unknown;
}

export interface EditorLayout {
  sidebarVisible: boolean;
  panelVisible: boolean;
  sidebarWidth: number;
  panelHeight: number;
}

export interface EditorConfig {
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  theme: string;
}
