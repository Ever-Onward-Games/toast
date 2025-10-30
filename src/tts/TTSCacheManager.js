/**
 * TTS Cache Manager - IndexedDB-based audio caching
 */
class TTSCacheManager {
  static DB_NAME = "toast-tts-cache";
  static STORE_NAME = "audio";
  static DB_VERSION = 1;
  static db = null;

  /**
   * Initialize IndexedDB
   */
  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("Toast | Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Toast | IndexedDB initialized");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: "key" });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("size", "size", { unique: false });
          console.log("Toast | Created IndexedDB object store");
        }
      };
    });
  }

  /**
   * Generate cache key from text and voice ID
   */
  static generateKey(text, voiceId) {
    const combined = `${text}|${voiceId}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `tts_${Math.abs(hash)}`;
  }

  /**
   * Get audio from cache
   */
  static async get(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Toast | Cache hit: ${key}`);
          resolve(request.result.audio);
        } else {
          console.log(`Toast | Cache miss: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn("Toast | Cache get error:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save audio to cache
   */
  static async set(key, audioData) {
    if (!this.db) await this.init();

    const entry = {
      key: key,
      audio: audioData,
      timestamp: Date.now(),
      size: audioData.length
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`Toast | Cached audio: ${key} (${(audioData.length / 1024).toFixed(1)} KB)`);
        resolve();
      };

      request.onerror = () => {
        console.warn("Toast | Cache set error:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get total cache size in bytes
   */
  static async getSize() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, entry) => sum + entry.size, 0);
        resolve(totalSize);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get number of cached entries
   */
  static async count() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache
   */
  static async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("Toast | Cache cleared");
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Evict old entries if cache size exceeds limit
   */
  static async evictIfNeeded(maxSizeMB) {
    if (!this.db) await this.init();

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const currentSize = await this.getSize();

    if (currentSize <= maxSizeBytes) return;

    console.log(`Toast | Cache size (${(currentSize / 1024 / 1024).toFixed(1)} MB) exceeds limit (${maxSizeMB} MB), evicting old entries`);

    // Get all entries sorted by timestamp
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("timestamp");
      const request = index.openCursor();

      const entries = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          entries.push({ key: cursor.value.key, size: cursor.value.size });
          cursor.continue();
        } else {
          // Delete oldest entries until under limit
          let deletedSize = 0;
          let i = 0;
          while (deletedSize + currentSize > maxSizeBytes && i < entries.length) {
            store.delete(entries[i].key);
            deletedSize += entries[i].size;
            i++;
          }
          console.log(`Toast | Evicted ${i} old entries (${(deletedSize / 1024 / 1024).toFixed(1)} MB)`);
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}
