/**
 * @module sanitize
 * @description Input sanitization utilities for preventing XSS and injection attacks.
 * Provides functions to clean user input across the CodeForge IDE application.
 */

/** Map of HTML entities for escaping */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize HTML entities in user input to prevent XSS attacks.
 * Escapes dangerous characters that could be used for script injection.
 *
 * @param input - The raw user input string
 * @returns Sanitized string with HTML entities escaped
 *
 * @example
 * ```typescript
 * sanitizeHTML('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Sanitize file path to prevent path traversal attacks.
 * Removes directory traversal sequences and normalizes path separators.
 *
 * @param path - The raw file path string
 * @returns Sanitized path without traversal sequences
 *
 * @example
 * ```typescript
 * sanitizePath('../../etc/passwd');
 * // Returns: 'etc/passwd'
 * ```
 */
export function sanitizePath(path: string): string {
  if (!path) return '';
  return path
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/^\//, '')
    .trim();
}

/**
 * Sanitize terminal command input by removing control characters.
 * Preserves normal whitespace (spaces, tabs, newlines) while removing
 * potentially dangerous control characters.
 *
 * @param command - The raw terminal command string
 * @returns Sanitized command without control characters
 *
 * @example
 * ```typescript
 * sanitizeCommand('ls\x00 -la');
 * // Returns: 'ls -la'
 * ```
 */
export function sanitizeCommand(command: string): string {
  if (!command) return '';
  return command.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize file name by removing invalid characters.
 * Strips characters that are not allowed in file names across platforms,
 * removes leading dots, and enforces a maximum length of 255 characters.
 *
 * @param name - The raw file name string
 * @returns Sanitized file name
 *
 * @example
 * ```typescript
 * sanitizeFileName('file<>:"name".txt');
 * // Returns: 'filename.txt'
 * ```
 */
export function sanitizeFileName(name: string): string {
  if (!name) return '';
  return name
    .replace(/[<>:"|?*\\]/g, '')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 255);
}
