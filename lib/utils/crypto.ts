/**
 * CodeForge IDE — Crypto Utilities
 * Lightweight AES-GCM encryption for sensitive data stored client-side.
 * Key is derived from a per-session secret stored in sessionStorage.
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const SESSION_KEY = 'codeforge-ek';

/** Generate or retrieve the session encryption key */
async function getKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') {
    throw new Error('crypto utils are client-side only');
  }

  let rawHex = sessionStorage.getItem(SESSION_KEY);

  if (!rawHex) {
    // Generate a fresh random key for this session
    const raw = crypto.getRandomValues(new Uint8Array(32));
    rawHex = Array.from(raw)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(SESSION_KEY, rawHex);
  }

  const keyBytes = new Uint8Array(
    rawHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
  );

  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain-text string.
 * Returns a base64-encoded string: iv(12 bytes) + ciphertext.
 */
export async function encryptValue(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a value previously encrypted with encryptValue.
 * Returns null if decryption fails (tampered / wrong session).
 */
export async function decryptValue(encoded: string): Promise<string | null> {
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const cipherBuf = combined.slice(12);

    const plainBuf = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      cipherBuf
    );

    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}
