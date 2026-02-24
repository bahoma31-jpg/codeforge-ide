export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  lineHeight: number;
  minimap: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  theme: string;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  settings: EditorSettings;
}

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'plaintext';
