import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizePath,
  sanitizeCommand,
  sanitizeFileName,
} from '../sanitize';

describe('sanitizeHTML', () => {
  it('should escape HTML script tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should escape all dangerous characters', () => {
    expect(sanitizeHTML('&')).toBe('&amp;');
    expect(sanitizeHTML('<')).toBe('&lt;');
    expect(sanitizeHTML('>')).toBe('&gt;');
    expect(sanitizeHTML('"')).toBe('&quot;');
    expect(sanitizeHTML("'")).toBe('&#x27;');
    expect(sanitizeHTML('/')).toBe('&#x2F;');
  });

  it('should handle empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('should return empty string for falsy input', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('should preserve safe text', () => {
    expect(sanitizeHTML('Hello World')).toBe('Hello World');
  });

  it('should handle mixed content', () => {
    const input = 'Hello <b>World</b> & "Friends"';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<b>');
    expect(result).toContain('&lt;b&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
  });
});

describe('sanitizePath', () => {
  it('should remove path traversal attempts', () => {
    expect(sanitizePath('../../etc/passwd')).not.toContain('..');
  });

  it('should normalize double slashes', () => {
    expect(sanitizePath('path//to//file')).toBe('path/to/file');
  });

  it('should remove leading slash', () => {
    expect(sanitizePath('/root/file.txt')).toBe('root/file.txt');
  });

  it('should handle empty string', () => {
    expect(sanitizePath('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizePath('  path/to/file  ')).toBe('path/to/file');
  });

  it('should handle complex traversal attempts', () => {
    const result = sanitizePath('../../../var/log/../etc/passwd');
    expect(result).not.toContain('..');
  });
});

describe('sanitizeCommand', () => {
  it('should remove null bytes', () => {
    expect(sanitizeCommand('ls\x00 -la')).toBe('ls -la');
  });

  it('should remove control characters', () => {
    expect(sanitizeCommand('echo\x01\x02\x03hello')).toBe('echohello');
  });

  it('should preserve normal whitespace', () => {
    expect(sanitizeCommand('ls -la /tmp')).toBe('ls -la /tmp');
  });

  it('should preserve tabs and newlines', () => {
    expect(sanitizeCommand('echo\thello\nworld')).toBe('echo\thello\nworld');
  });

  it('should handle empty string', () => {
    expect(sanitizeCommand('')).toBe('');
  });

  it('should remove DEL character', () => {
    expect(sanitizeCommand('test\x7Fvalue')).toBe('testvalue');
  });
});

describe('sanitizeFileName', () => {
  it('should remove invalid characters', () => {
    expect(sanitizeFileName('file<>:name.txt')).toBe('filename.txt');
  });

  it('should remove pipe and question mark', () => {
    expect(sanitizeFileName('file|name?.txt')).toBe('filename.txt');
  });

  it('should remove asterisk and backslash', () => {
    expect(sanitizeFileName('file*name\\.txt')).toBe('filename.txt');
  });

  it('should remove leading dots', () => {
    expect(sanitizeFileName('...hidden')).toBe('hidden');
  });

  it('should truncate to 255 characters', () => {
    const longName = 'a'.repeat(300);
    expect(sanitizeFileName(longName).length).toBe(255);
  });

  it('should handle empty string', () => {
    expect(sanitizeFileName('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeFileName('  myfile.txt  ')).toBe('myfile.txt');
  });

  it('should remove double quotes', () => {
    expect(sanitizeFileName('"myfile".txt')).toBe('myfile.txt');
  });
});
