/**
 * Input sanitization utilities for preventing XSS, path traversal,
 * and other injection attacks.
 */

/**
 * Sanitize HTML input to prevent XSS attacks.
 * Escapes dangerous HTML characters and removes script tags.
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize file paths to prevent path traversal attacks.
 * Removes '..' segments and normalizes multiple slashes.
 */
export function sanitizePath(path: string): string {
  if (!path) return '';

  return path
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path traversal sequences
    .replace(/\.\./g, '')
    // Normalize multiple slashes to single slash
    .replace(/\/{2,}/g, '/')
    // Remove leading slash for relative paths
    .replace(/^\//, '')
    // Clean up any remaining empty segments
    .replace(/\/{2,}/g, '/')
    .trim();
}

/**
 * Sanitize terminal commands by removing control characters.
 * Preserves tab (0x09), newline (0x0A), and carriage return (0x0D).
 */
export function sanitizeCommand(command: string): string {
  if (!command) return '';

  return command
    // Remove ASCII control characters except tab, newline, carriage return
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize file names by removing invalid characters.
 * Enforces a maximum length of 255 characters.
 */
export function sanitizeFileName(name: string): string {
  if (!name || !name.trim()) return 'untitled';

  const sanitized = name
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove characters invalid for filenames
    .replace(/[/\\:*?"<>|]/g, '')
    // Remove leading/trailing dots and whitespace
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Truncate to 255 characters
    .slice(0, 255);

  return sanitized || 'untitled';
}
