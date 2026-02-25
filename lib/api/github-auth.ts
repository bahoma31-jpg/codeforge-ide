/**
 * CodeForge IDE - GitHub Authentication
 * Agent 5: GitHub Integration
 * 
 * Handles GitHub OAuth and Personal Access Token authentication
 * with secure encrypted storage in IndexedDB
 */

import { GitHubToken, GitHubUser } from './github-types';
import { openDB, IDBPDatabase } from 'idb';

const AUTH_DB_NAME = 'codeforge-auth';
const AUTH_DB_VERSION = 1;
const AUTH_STORE_NAME = 'tokens';

/**
 * Web Crypto API encryption key derivation
 */
const ENCRYPTION_KEY_SALT = 'codeforge-github-auth-v1';

let cachedKey: CryptoKey | null = null;

/**
 * Derive encryption key from password/salt using PBKDF2
 */
async function deriveKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY_SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('codeforge-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  cachedKey = key;
  return key;
}

/**
 * Encrypt token using AES-GCM
 */
async function encryptToken(token: string): Promise<string> {
  const key = await deriveKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt token using AES-GCM
 */
async function decryptToken(encryptedToken: string): Promise<string> {
  const key = await deriveKey();
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Open authentication database
 */
async function getAuthDB(): Promise<IDBPDatabase> {
  return openDB(AUTH_DB_NAME, AUTH_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(AUTH_STORE_NAME)) {
        db.createObjectStore(AUTH_STORE_NAME);
      }
    },
  });
}

/**
 * GitHub Authentication Manager
 */
export class GitHubAuth {
  private static instance: GitHubAuth;
  private token: GitHubToken | null = null;
  private user: GitHubUser | null = null;

  private constructor() {}

  static getInstance(): GitHubAuth {
    if (!GitHubAuth.instance) {
      GitHubAuth.instance = new GitHubAuth();
    }
    return GitHubAuth.instance;
  }

  /**
   * Authenticate with Personal Access Token
   */
  async authenticateWithPAT(token: string): Promise<GitHubUser> {
    try {
      // Validate token by fetching user info
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const user: GitHubUser = await response.json();

      // Get token scopes from headers
      const scopes = response.headers.get('X-OAuth-Scopes')?.split(', ') || [];

      // Store token securely
      const githubToken: GitHubToken = {
        token,
        type: 'PAT',
        scopes,
        createdAt: new Date().toISOString(),
      };

      await this.saveToken(githubToken);
      this.token = githubToken;
      this.user = user;

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Save token to encrypted storage
   */
  private async saveToken(token: GitHubToken): Promise<void> {
    const db = await getAuthDB();
    const encrypted = await encryptToken(token.token);
    
    const tokenData = {
      ...token,
      token: encrypted,
    };

    await db.put(AUTH_STORE_NAME, tokenData, 'github-token');
  }

  /**
   * Load token from storage
   */
  async loadToken(): Promise<GitHubToken | null> {
    try {
      const db = await getAuthDB();
      const tokenData = await db.get(AUTH_STORE_NAME, 'github-token');

      if (!tokenData) return null;

      const decrypted = await decryptToken(tokenData.token);
      const token: GitHubToken = {
        ...tokenData,
        token: decrypted,
      };

      // Validate token
      const user = await this.validateToken(token.token);
      if (user) {
        this.token = token;
        this.user = user;
        return token;
      }

      return null;
    } catch (error) {
      console.error('Load token error:', error);
      return null;
    }
  }

  /**
   * Validate token by fetching user info
   */
  private async validateToken(token: string): Promise<GitHubUser | null> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token?.token || null;
  }

  /**
   * Get current user
   */
  getUser(): GitHubUser | null {
    return this.user;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): Record<string, string> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    return {
      'Authorization': `Bearer ${this.token.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };
  }

  /**
   * Logout - clear token and user
   */
  async logout(): Promise<void> {
    const db = await getAuthDB();
    await db.delete(AUTH_STORE_NAME, 'github-token');
    this.token = null;
    this.user = null;
  }

  /**
   * Check if token has required scopes
   */
  hasScopes(requiredScopes: string[]): boolean {
    if (!this.token) return false;

    return requiredScopes.every(scope => 
      this.token!.scopes.includes(scope)
    );
  }

  /**
   * Get missing scopes
   */
  getMissingScopes(requiredScopes: string[]): string[] {
    if (!this.token) return requiredScopes;

    return requiredScopes.filter(scope => 
      !this.token!.scopes.includes(scope)
    );
  }
}

/**
 * Required scopes for CodeForge IDE
 */
export const REQUIRED_SCOPES = [
  'repo',        // Full access to repositories
  'user:email',  // Read user email
  'read:org',    // Read organization membership (optional)
];

/**
 * Singleton instance
 */
export const githubAuth = GitHubAuth.getInstance();
