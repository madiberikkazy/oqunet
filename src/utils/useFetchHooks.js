/**
 * Hook for efficient data fetching with caching and deduplication
 */

import { useEffect, useRef, useState } from "react";
import { cacheService } from "./cacheService.js";
import { debounce } from "./performanceHelpers.js";

/**
 * Custom hook for fetching data with caching and deduplication
 */
export function useDataFetch(fetchFn, dependencies = [], options = {}) {
  const {
    cacheKey = null,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    debounceDelay = 300,
    skipCache = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const debouncedFetchRef = useRef(null);

  // Create debounced fetch function
  if (!debouncedFetchRef.current) {
    debouncedFetchRef.current = debounce(async () => {
      // Check cache first
      if (cacheKey && !skipCache && cacheService.has(cacheKey)) {
        setData(cacheService.get(cacheKey));
        setLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const result = await fetchFn(abortControllerRef.current.signal);

        // Cache result if cache key is provided
        if (cacheKey && !skipCache) {
          cacheService.set(cacheKey, result, cacheTTL);
        }

        setData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }, debounceDelay);
  }

  useEffect(() => {
    debouncedFetchRef.current?.();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedFetchRef.current?.cancel?.();
    };
  }, dependencies);

  return { data, loading, error };
}

/**
 * Hook for paginated data fetching
 */
export function usePaginatedFetch(fetchPageFn, dependencies = [], options = {}) {
  const { pageSize = 20, cacheTTL = 5 * 60 * 1000 } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const abortControllerRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    const loadInitial = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const { items: newItems, nextCursor } = await fetchPageFn(
          null,
          pageSize,
          abortControllerRef.current.signal
        );

        setItems(newItems || []);
        setCursor(nextCursor || null);
        setHasMore(!!nextCursor);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  // Load more function
  const loadMore = async () => {
    if (!hasMore || loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);

      const { items: newItems, nextCursor } = await fetchPageFn(
        cursor,
        pageSize,
        abortControllerRef.current.signal
      );

      setItems((prev) => [
        ...prev,
        ...(newItems || []).filter((item) => !prev.find((p) => p.id === item.id)),
      ]);
      setCursor(nextCursor || null);
      setHasMore(!!nextCursor);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset function
  const reset = () => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  };

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}

/**
 * Hook for batch fetching with controlled concurrency
 */
export function useBatchFetch(ids, fetchFn, options = {}) {
  const { concurrency = 5, cacheTTL = 5 * 60 * 1000 } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!ids || ids.length === 0) {
      setData([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchBatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = [];
        for (let i = 0; i < ids.length; i += concurrency) {
          if (signal.aborted) return;

          const batch = ids.slice(i, i + concurrency);
          const batchResults = await Promise.all(batch.map(fetchFn));
          results.push(...batchResults);
        }

        setData(results);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [JSON.stringify(ids), concurrency]);

  return { data, loading, error };
}
