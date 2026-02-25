import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizePath,
  sanitizeCommand,
  sanitizeFileName,
} from '../sanitize';

describe('sanitizeHTML', () => {
  it('should remove script tags by escaping them', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should handle empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('should escape < and > characters', () => {
    expect(sanitizeHTML('<div>hello</div>')).toBe(
      '&lt;div&gt;hello&lt;/div&gt;'
    );
  });

  it('should escape quotes and ampersand', () => {
    expect(sanitizeHTML('"Tom & Jerry"')).toBe(
      '&quot;Tom &amp; Jerry&quot;'
    );
  });

  it('should escape single quotes', () => {
    expect(sanitizeHTML("it's")).toBe('it&#x27;s');
  });
});

describe('sanitizePath', () => {
  it('should remove .. segments', () => {
    const result = sanitizePath('../../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('should normalize multiple slashes to single slash', () => {
    const result = sanitizePath('path//to///file');
    expect(result).toBe('path/to/file');
  });

  it('should handle empty string', () => {
    expect(sanitizePath('')).toBe('');
  });

  it('should remove leading slash', () => {
    const result = sanitizePath('/path/to/file');
    expect(result).toBe('path/to/file');
  });
});

describe('sanitizeCommand', () => {
  it('should remove control characters', () => {
    const input = 'hello\x00world\x1Ftest';
    const result = sanitizeCommand(input);
    expect(result).toBe('helloworldtest');
  });

  it('should keep normal text', () => {
    expect(sanitizeCommand('ls -la /home')).toBe('ls -la /home');
  });

  it('should preserve tabs and newlines', () => {
    const input = 'line1\nline2\ttab';
    const result = sanitizeCommand(input);
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  it('should handle empty string', () => {
    expect(sanitizeCommand('')).toBe('');
  });

  it('should remove DEL character (0x7F)', () => {
    const input = 'test\x7Fvalue';
    const result = sanitizeCommand(input);
    expect(result).toBe('testvalue');
  });
});

describe('sanitizeFileName', () => {
  it('should remove invalid characters', () => {
    const result = sanitizeFileName('file/name:with*invalid?chars');
    expect(result).toBe('filenamewithinvalidchars');
  });

  it('should truncate to 255 characters', () => {
    const longName = 'a'.repeat(300);
    const result = sanitizeFileName(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('should return untitled for empty input', () => {
    expect(sanitizeFileName('')).toBe('untitled');
  });

  it('should return untitled for whitespace-only input', () => {
    expect(sanitizeFileName('   ')).toBe('untitled');
  });

  it('should remove leading and trailing dots', () => {
    const result = sanitizeFileName('...filename...');
    expect(result).toBe('filename');
  });

  it('should remove pipe and backslash characters', () => {
    const result = sanitizeFileName('file|name\\test');
    expect(result).toBe('filenametest');
  });
});
