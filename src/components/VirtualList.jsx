/**
 * Virtual list component - renders only visible items
 * Dramatically improves performance when dealing with hundreds/thousands of items
 */

import React, { useState, useEffect, useRef, useMemo } from "react";

export function VirtualList({
  items = [],
  itemHeight = 100,
  containerHeight = 400,
  renderItem,
  overscan = 3,
  keyExtractor = (item, idx) => idx,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(
    () =>
      items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, idx) => ({
        item,
        index: visibleRange.startIndex + idx,
      })),
    [items, visibleRange]
  );

  const offsetY = visibleRange.startIndex * itemHeight;
  const spacerHeight = (items.length - visibleRange.endIndex) * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {visibleItems.map(({ item, index }) => (
          <div key={keyExtractor(item, index)} style={{ height: itemHeight }}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {spacerHeight > 0 && <div style={{ height: spacerHeight }} />}
    </div>
  );
}

/**
 * Virtual list variant for variable height items
 * Requires itemHeights array for accurate calculations
 */
export function VirtualListVariable({
  items = [],
  itemHeights = [],
  containerHeight = 400,
  renderItem,
  overscan = 3,
  keyExtractor = (item, idx) => idx,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate cumulative heights
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    let total = 0;
    itemHeights.forEach((h) => {
      total += h;
      heights.push(total);
    });
    return heights;
  }, [itemHeights]);

  // Find visible range
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length;

    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i] >= scrollTop - itemHeights[i] * overscan) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    for (let i = startIndex; i < cumulativeHeights.length; i++) {
      if (cumulativeHeights[i] > scrollTop + containerHeight + itemHeights[i] * overscan) {
        endIndex = Math.min(items.length, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, cumulativeHeights, containerHeight, itemHeights, items.length, overscan]);

  const visibleItems = useMemo(
    () =>
      items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, idx) => ({
        item,
        index: visibleRange.startIndex + idx,
      })),
    [items, visibleRange]
  );

  const offsetY = cumulativeHeights[visibleRange.startIndex] || 0;
  const spacerHeight = (cumulativeHeights[items.length] || 0) - (cumulativeHeights[visibleRange.endIndex] || 0);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {visibleItems.map(({ item, index }) => (
          <div key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {spacerHeight > 0 && <div style={{ height: spacerHeight }} />}
    </div>
  );
}
