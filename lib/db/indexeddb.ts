/**
 * CodeForge IDE - IndexedDB Wrapper
 * Agent 4: File System Manager
 *
 * Low-level IndexedDB operations wrapper
 */

import { DB_NAME, DB_VERSION, STORE_NAME, migrations } from './schema';
import type { FileNode } from './schema';

/**
 * IndexedDB connection manager
 */
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open database connection with migration support
   */
  async connect(): Promise<IDBDatabase> {
    // Return existing connection if available
    if (this.db) {
      return this.db;
    }

    // Return in-progress connection
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.connectionPromise = null;
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.connectionPromise = null;

        // Handle unexpected close
        this.db.onclose = () => {
          this.db = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;

        // Run migrations
        for (let version = oldVersion + 1; version <= DB_VERSION; version++) {
          const migration = migrations[version];
          if (migration) {
            try {
              migration(db, transaction);
              console.log(`Migration ${version} completed successfully`);
            } catch (error) {
              console.error(`Migration ${version} failed:`, error);
              throw error;
            }
          }
        }
      };
    });

    return this.connectionPromise;
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.connectionPromise = null;
  }

  /**
   * Get a transaction
   */
  private async getTransaction(
    mode: IDBTransactionMode = 'readonly'
  ): Promise<{ transaction: IDBTransaction; store: IDBObjectStore }> {
    const db = await this.connect();
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    return { transaction, store };
  }

  /**
   * Generic get operation
   */
  async get<T = FileNode>(id: string): Promise<T | undefined> {
    const { store } = await this.getTransaction('readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic getAll operation
   */
  async getAll<T = FileNode>(): Promise<T[]> {
    const { store } = await this.getTransaction('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get by index
   */
  async getByIndex<T = FileNode>(
    indexName: string,
    key: IDBValidKey
  ): Promise<T | undefined> {
    const { store } = await this.getTransaction('readonly');
    return new Promise((resolve, reject) => {
      const index = store.index(indexName);
      const request = index.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all by index
   */
  async getAllByIndex<T = FileNode>(
    indexName: string,
    key?: IDBValidKey
  ): Promise<T[]> {
    const { store } = await this.getTransaction('readonly');
    return new Promise((resolve, reject) => {
      const index = store.index(indexName);
      const request = key !== undefined ? index.getAll(key) : index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic put operation (insert or update)
   */
  async put<T = FileNode>(data: T): Promise<void> {
    const { store } = await this.getTransaction('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic delete operation
   */
  async delete(id: string): Promise<void> {
    const { store } = await this.getTransaction('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete multiple records
   */
  async deleteMany(ids: string[]): Promise<void> {
    const { store } = await this.getTransaction('readwrite');
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      ids.forEach((id) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          completed++;
          if (completed === ids.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  }

  /**
   * Clear all data from store
   */
  async clear(): Promise<void> {
    const { store } = await this.getTransaction('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in store
   */
  async count(): Promise<number> {
    const { store } = await this.getTransaction('readonly');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if database exists
   */
  static async exists(): Promise<boolean> {
    if (!indexedDB.databases) {
      // Fallback for browsers that don't support databases()
      try {
        const db = await indexedDB.open(DB_NAME);
        const exists = db.objectStoreNames.length > 0;
        db.close();
        return exists;
      } catch {
        return false;
      }
    }

    const databases = await indexedDB.databases();
    return databases.some((db) => db.name === DB_NAME);
  }

  /**
   * Delete entire database
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
let instance: IndexedDBManager | null = null;

/**
 * Get singleton instance of IndexedDBManager
 */
export function getDBManager(): IndexedDBManager {
  if (!instance) {
    instance = new IndexedDBManager();
  }
  return instance;
}

/**
 * Initialize database (call on app startup)
 */
export async function initializeDB(): Promise<void> {
  const manager = getDBManager();
  await manager.connect();
  console.log('IndexedDB initialized successfully');
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  const manager = getDBManager();
  await manager.disconnect();
  instance = null;
  console.log('IndexedDB connection closed');
}
