import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { setTheme, toggleTheme } from '@/lib/utils/theme';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const {
    toggleSidebar,
    togglePanel,
    theme,
    setTheme: setThemeInStore,
  } = useUIStore();
  const { activeTabId, closeTab } = useEditorStore();

  const chordRef = useRef<{ armed: boolean; ts: number }>({
    armed: false,
    ts: 0,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /mac/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (key === 'j') {
        e.preventDefault();
        togglePanel();
        return;
      }

      if (key === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      if (key === 'k') {
        e.preventDefault();
        chordRef.current = { armed: true, ts: Date.now() };
        return;
      }

      if (key === 't') {
        const { armed, ts } = chordRef.current;
        if (armed && Date.now() - ts <= 1000) {
          e.preventDefault();
          const next = toggleTheme(theme);
          setTheme(next);
          setThemeInStore(next);
        }
        chordRef.current = { armed: false, ts: 0 };
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    toggleSidebar,
    togglePanel,
    closeTab,
    activeTabId,
    theme,
    setThemeInStore,
  ]);
}
