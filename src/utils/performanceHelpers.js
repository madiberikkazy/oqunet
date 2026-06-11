/**
 * Debounce function - delays execution until after n milliseconds have elapsed
 * Useful for search, filter, and resize handlers
 */
export function debounce(func, wait = 300) {
  let timeoutId;
  function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  }
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

/**
 * Throttle function - limits execution to once every n milliseconds
 * Useful for scroll and resize events
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  function throttled(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }
  throttled.cancel = () => (inThrottle = false);
  return throttled;
}

/**
 * Batch execute promises with concurrency control
 * Prevents overwhelming the server with too many simultaneous requests
 */
export async function batchExecute(items, executeFunc, concurrency = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(executeFunc));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Deduplication helper - remove duplicate items from array
 */
export function deduplicate(items, keyFn = (item) => item.id) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Merge arrays while avoiding duplicates
 */
export function mergeUniqueArrays(arr1, arr2, keyFn = (item) => item.id) {
  const map = new Map();
  [...arr1, ...arr2].forEach((item) => {
    const key = keyFn(item);
    map.set(key, item);
  });
  return Array.from(map.values());
}
