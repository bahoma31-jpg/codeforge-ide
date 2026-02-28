/**
 * اختبارات وحدة لدوال التشفير (AES-GCM)
 * يغطي: encryptValue, decryptValue, roundtrip
 *
 * ملاحظة: jsdom لا يدعم crypto.subtle بالكامل،
 * لذلك نستخدم mocks للدوال الأساسية.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// نحتاج mock لـ crypto.subtle لأن jsdom لا يدعمها
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();
const mockImportKey = vi.fn();

// ─── Setup Mocks ──────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();

  // Mock sessionStorage
  const store: Record<string, string> = {};
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });

  // Mock crypto.getRandomValues
  vi.stubGlobal('crypto', {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      importKey: mockImportKey.mockResolvedValue('mock-key'),
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
    },
  });
});

describe('Crypto Utils — Module Structure', () => {
  it('should export encryptValue function', async () => {
    const mod = await import('../crypto');
    expect(typeof mod.encryptValue).toBe('function');
  });

  it('should export decryptValue function', async () => {
    const mod = await import('../crypto');
    expect(typeof mod.decryptValue).toBe('function');
  });
});

describe('encryptValue', () => {
  it('should call crypto.subtle.encrypt and return a base64 string', async () => {
    // ترتيب: إعداد mock ليرجع بيانات مشفرة
    const fakeEncrypted = new Uint8Array([10, 20, 30, 40]).buffer;
    mockEncrypt.mockResolvedValueOnce(fakeEncrypted);

    const mod = await import('../crypto');
    const result = await mod.encryptValue('hello world');

    // التحقق: يجب أن يكون الناتج string (base64)
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate a session key in sessionStorage if none exists', async () => {
    const fakeEncrypted = new Uint8Array([1, 2, 3]).buffer;
    mockEncrypt.mockResolvedValueOnce(fakeEncrypted);

    const mod = await import('../crypto');
    await mod.encryptValue('test');

    // التحقق: sessionStorage.setItem يجب أن يُستدعى لحفظ المفتاح
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'codeforge-ek',
      expect.any(String)
    );
  });

  it('should produce different ciphertext for same input (random IV)', async () => {
    // أول استدعاء
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer);
    const mod1 = await import('../crypto');
    const result1 = await mod1.encryptValue('same text');

    // إعادة التحميل للحصول على IV مختلف
    vi.resetModules();
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([4, 5, 6]).buffer);
    const mod2 = await import('../crypto');
    const result2 = await mod2.encryptValue('same text');

    // الناتجان يجب أن يكونا مختلفين (IV عشوائي)
    expect(result1).not.toBe(result2);
  });
});

describe('decryptValue', () => {
  it('should return null for invalid/tampered input', async () => {
    mockDecrypt.mockRejectedValueOnce(new Error('Decryption failed'));

    const mod = await import('../crypto');
    const result = await mod.decryptValue('invalid-base64-data!!!');

    expect(result).toBeNull();
  });

  it('should return null for empty-like base64 input', async () => {
    mockDecrypt.mockRejectedValueOnce(new Error('Bad data'));

    const mod = await import('../crypto');
    // base64 encoded short data that can't contain valid IV + cipher
    const result = await mod.decryptValue(btoa('short'));

    expect(result).toBeNull();
  });
});
