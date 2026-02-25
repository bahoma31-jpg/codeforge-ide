import { describe, it, expect, beforeEach } from 'vitest';
import { useExtensionsStore } from '../extensions-store';
import type { Extension } from '../extensions-store';

function resetStore() {
  useExtensionsStore.setState({
    extensions: [],
    installedCount: 0,
    enabledCount: 0,
    searchQuery: '',
    selectedCategory: 'all',
  });
}

const mockExtension: Omit<Extension, 'installedAt'> = {
  id: 'ext-1',
  name: 'Python Support',
  description: 'Python language support',
  version: '1.0.0',
  author: 'CodeForge',
  status: 'installed',
  category: 'languages',
  enabled: true,
};

describe('ExtensionsStore', () => {
  beforeEach(() => resetStore());

  it('should start with empty extensions', () => {
    const state = useExtensionsStore.getState();
    expect(state.extensions).toHaveLength(0);
    expect(state.installedCount).toBe(0);
    expect(state.enabledCount).toBe(0);
  });

  it('should add an extension', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    const state = useExtensionsStore.getState();
    expect(state.extensions).toHaveLength(1);
    expect(state.extensions[0].name).toBe('Python Support');
    expect(state.installedCount).toBe(1);
  });

  it('should not add duplicate extensions', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().addExtension(mockExtension);
    expect(useExtensionsStore.getState().extensions).toHaveLength(1);
  });

  it('should set installedAt timestamp', () => {
    const before = Date.now();
    useExtensionsStore.getState().addExtension(mockExtension);
    const ext = useExtensionsStore.getState().extensions[0];
    expect(ext.installedAt).toBeGreaterThanOrEqual(before);
  });

  it('should remove an extension', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().removeExtension('ext-1');
    expect(useExtensionsStore.getState().extensions).toHaveLength(0);
    expect(useExtensionsStore.getState().installedCount).toBe(0);
  });

  it('should enable an extension', () => {
    useExtensionsStore
      .getState()
      .addExtension({ ...mockExtension, enabled: false });
    useExtensionsStore.getState().enableExtension('ext-1');
    const ext = useExtensionsStore.getState().extensions[0];
    expect(ext.enabled).toBe(true);
    expect(ext.status).toBe('enabled');
  });

  it('should disable an extension', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().disableExtension('ext-1');
    const ext = useExtensionsStore.getState().extensions[0];
    expect(ext.enabled).toBe(false);
    expect(ext.status).toBe('disabled');
  });

  it('should toggle extension state', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().toggleExtension('ext-1');
    expect(useExtensionsStore.getState().extensions[0].enabled).toBe(false);
    useExtensionsStore.getState().toggleExtension('ext-1');
    expect(useExtensionsStore.getState().extensions[0].enabled).toBe(true);
  });

  it('should update enabledCount correctly', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().addExtension({
      ...mockExtension,
      id: 'ext-2',
      name: 'JS',
      enabled: false,
    });
    expect(useExtensionsStore.getState().enabledCount).toBe(1);
    useExtensionsStore.getState().enableExtension('ext-2');
    expect(useExtensionsStore.getState().enabledCount).toBe(2);
  });

  it('should set search query', () => {
    useExtensionsStore.getState().setSearchQuery('python');
    expect(useExtensionsStore.getState().searchQuery).toBe('python');
  });

  it('should filter extensions by search query', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().addExtension({
      ...mockExtension,
      id: 'ext-2',
      name: 'JavaScript',
      description: 'JS support',
    });
    useExtensionsStore.getState().setSearchQuery('python');
    const filtered = useExtensionsStore.getState().getFilteredExtensions();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Python Support');
  });

  it('should filter extensions by category', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().addExtension({
      ...mockExtension,
      id: 'ext-2',
      name: 'Theme',
      category: 'themes',
    });
    useExtensionsStore.getState().setSelectedCategory('themes');
    const filtered = useExtensionsStore.getState().getFilteredExtensions();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('themes');
  });

  it('should clear all extensions', () => {
    useExtensionsStore.getState().addExtension(mockExtension);
    useExtensionsStore.getState().clearAll();
    const state = useExtensionsStore.getState();
    expect(state.extensions).toHaveLength(0);
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBe('all');
  });
});
