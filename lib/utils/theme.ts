import type { CodeforgeTheme } from '@/lib/stores/ui-store';

const KEY = 'codeforge-theme';

export function getTheme(): CodeforgeTheme {
  if (typeof window === 'undefined') return 'dark';
  const raw = window.localStorage.getItem(KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'high-contrast') return raw;
  return 'dark';
}

export function applyTheme(theme: CodeforgeTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: CodeforgeTheme) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(current: CodeforgeTheme): CodeforgeTheme {
  return current === 'light' ? 'dark' : 'light';
}
