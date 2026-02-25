/**
 * Git Log utility — maintains an in-memory log of git operations.
 * Used by the Panel component to display git output.
 */

export interface GitLogEntry {
  id: string;
  timestamp: number;
  command: string;
  output: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

type GitLogSubscriber = (entries: GitLogEntry[]) => void;

let logs: GitLogEntry[] = [];
const subscribers: Set<GitLogSubscriber> = new Set();

function notifySubscribers(): void {
  const snapshot = [...logs];
  subscribers.forEach((fn) => fn(snapshot));
}

/**
 * Add a new log entry.
 */
export function addGitLog(entry: Omit<GitLogEntry, 'id' | 'timestamp'>): void {
  logs.push({
    ...entry,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  });
  notifySubscribers();
}

/**
 * Get all current log entries.
 */
export function getGitLogs(): GitLogEntry[] {
  return [...logs];
}

/**
 * Clear all log entries.
 */
export function clearGitLogs(): void {
  logs = [];
  notifySubscribers();
}

/**
 * Subscribe to log changes. Returns an unsubscribe function.
 */
export function subscribeToGitLogs(fn: GitLogSubscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
