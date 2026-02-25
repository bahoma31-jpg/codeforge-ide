import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, DEFAULT_SETTINGS } from '../settings-store';

function resetStore() {
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    isDirty: false,
  });
}

describe('SettingsStore', () => {
  beforeEach(() => resetStore());

  it('should start with default settings', () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.editor.fontSize).toBe(14);
    expect(settings.editor.tabSize).toBe(2);
    expect(settings.theme.theme).toBe('dark');
    expect(settings.terminal.fontSize).toBe(13);
  });

  it('should not be dirty initially', () => {
    expect(useSettingsStore.getState().isDirty).toBe(false);
  });

  it('should update editor settings', () => {
    useSettingsStore.getState().updateEditorSettings({ fontSize: 18 });
    expect(useSettingsStore.getState().settings.editor.fontSize).toBe(18);
  });

  it('should mark as dirty after editor update', () => {
    useSettingsStore.getState().updateEditorSettings({ fontSize: 18 });
    expect(useSettingsStore.getState().isDirty).toBe(true);
  });

  it('should preserve other editor settings when updating', () => {
    useSettingsStore.getState().updateEditorSettings({ fontSize: 20 });
    const { editor } = useSettingsStore.getState().settings;
    expect(editor.fontSize).toBe(20);
    expect(editor.tabSize).toBe(2); // preserved
    expect(editor.minimap).toBe(true); // preserved
  });

  it('should update theme settings', () => {
    useSettingsStore.getState().updateThemeSettings({ theme: 'light' });
    expect(useSettingsStore.getState().settings.theme.theme).toBe('light');
  });

  it('should update accent color', () => {
    useSettingsStore.getState().updateThemeSettings({ accentColor: '#ff0000' });
    expect(useSettingsStore.getState().settings.theme.accentColor).toBe('#ff0000');
  });

  it('should update terminal settings', () => {
    useSettingsStore.getState().updateTerminalSettings({ fontSize: 16, cursorBlink: false });
    const { terminal } = useSettingsStore.getState().settings;
    expect(terminal.fontSize).toBe(16);
    expect(terminal.cursorBlink).toBe(false);
  });

  it('should mark as dirty after terminal update', () => {
    useSettingsStore.getState().updateTerminalSettings({ fontSize: 10 });
    expect(useSettingsStore.getState().isDirty).toBe(true);
  });

  it('should reset to defaults', () => {
    useSettingsStore.getState().updateEditorSettings({ fontSize: 30 });
    useSettingsStore.getState().updateThemeSettings({ theme: 'light' });
    useSettingsStore.getState().resetToDefaults();

    const { settings, isDirty } = useSettingsStore.getState();
    expect(settings.editor.fontSize).toBe(14);
    expect(settings.theme.theme).toBe('dark');
    expect(isDirty).toBe(false);
  });

  it('should mark as clean', () => {
    useSettingsStore.getState().updateEditorSettings({ fontSize: 20 });
    expect(useSettingsStore.getState().isDirty).toBe(true);
    useSettingsStore.getState().markClean();
    expect(useSettingsStore.getState().isDirty).toBe(false);
  });

  it('should handle word wrap setting', () => {
    useSettingsStore.getState().updateEditorSettings({ wordWrap: 'off' });
    expect(useSettingsStore.getState().settings.editor.wordWrap).toBe('off');
  });

  it('should handle line numbers setting', () => {
    useSettingsStore.getState().updateEditorSettings({ lineNumbers: 'relative' });
    expect(useSettingsStore.getState().settings.editor.lineNumbers).toBe('relative');
  });

  it('should handle autoSave settings', () => {
    useSettingsStore.getState().updateEditorSettings({ autoSave: false, autoSaveDelay: 2000 });
    const { editor } = useSettingsStore.getState().settings;
    expect(editor.autoSave).toBe(false);
    expect(editor.autoSaveDelay).toBe(2000);
  });
});
