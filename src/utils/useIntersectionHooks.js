/**
 * Hook for infinite scroll / pagination
 * Automatically loads more data when user scrolls near the bottom
 */

import { useEffect, useRef, useCallback, useState } from "react";

export function useInfiniteScroll(options = {}) {
  const { threshold = 200, onLoadMore, containerSelector = null } = options;
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntersection = useCallback(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoading && onLoadMore) {
        setIsLoading(true);
        onLoadMore().finally(() => setIsLoading(false));
      }
    },
    [onLoadMore, isLoading]
  );

  useEffect(() => {
    const options = {
      root: containerSelector ? document.querySelector(containerSelector) : null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current && sentinelRef.current) {
        observerRef.current.unobserve(sentinelRef.current);
      }
    };
  }, [handleIntersection, threshold, containerSelector]);

  return { sentinelRef, isLoading };
}

/**
 * Hook for detecting when element is in viewport
 * Useful for lazy loading images, components, etc.
 */
export function useInView(ref, options = {}) {
  const [isInView, setIsInView] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        hasTriggered.current = true;
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return isInView;
}
