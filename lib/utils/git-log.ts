export interface GitLogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

// In-memory log store
let logEntries: GitLogEntry[] = [];
let listeners: Array<(entries: GitLogEntry[]) => void> = [];

export function addGitLog(
  type: GitLogEntry['type'],
  message: string,
  details?: string
): void {
  const entry: GitLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    type,
    message,
    details,
  };
  logEntries = [...logEntries, entry];
  // Keep only last 200 entries
  if (logEntries.length > 200) {
    logEntries = logEntries.slice(-200);
  }
  listeners.forEach((fn) => fn(logEntries));
}

export function clearGitLogs(): void {
  logEntries = [];
  listeners.forEach((fn) => fn(logEntries));
}

export function getGitLogs(): GitLogEntry[] {
  return logEntries;
}

export function subscribeToGitLogs(
  listener: (entries: GitLogEntry[]) => void
): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
}

// Helper: format relative time
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
