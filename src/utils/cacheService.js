/**
 * Client-side cache service with TTL (Time To Live) support
 * Prevents redundant API calls and improves performance
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Generate a cache key from function name and parameters
   */
  generateKey(prefix, params = {}) {
    const paramStr = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}:[${v.sort().join(",")}]`;
        if (typeof v === "object") return `${k}:{${JSON.stringify(v)}}`;
        return `${k}:${v}`;
      })
      .join("|");
    return `${prefix}:${paramStr}`;
  }

  /**
   * Get cached data
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Set cached data with TTL
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, data, ttl = 5 * 60 * 1000) {
    // Clear existing timer
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));

    // Store data
    this.cache.set(key, data);

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear specific cache entry
   */
  clear(key) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    this.cache.delete(key);
    this.timers.delete(key);
  }

  /**
   * Clear all cache entries matching a pattern
   */
  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter((k) => regex.test(k));
    keysToDelete.forEach((k) => this.clear(k));
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get or fetch data
   */
  async getOrFetch(key, fetchFn, ttl = 5 * 60 * 1000) {
    if (this.has(key)) {
      return this.get(key);
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService();
