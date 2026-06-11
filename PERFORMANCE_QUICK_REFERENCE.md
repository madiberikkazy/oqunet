# Performance Optimization - Quick Reference Guide

## Quick Start for Developers

### 1. Using the Cache Service

```javascript
import { cacheService } from './utils/cacheService.js';

// Simple caching
const result = await someExpensiveOperation();
cacheService.set('myKey', result, 5 * 60 * 1000); // 5 minute TTL

// Check if cached
if (cacheService.has('myKey')) {
  const cached = cacheService.get('myKey');
}

// Get or fetch pattern
const data = await cacheService.getOrFetch(
  'myKey',
  () => expensiveOperation(),
  5 * 60 * 1000
);

// Clear specific cache
cacheService.clear('myKey');

// Clear by pattern
cacheService.clearPattern('books:123'); // clears all books for community 123
```

### 2. Debouncing and Throttling

```javascript
import { debounce, throttle, batchExecute } from './utils/performanceHelpers.js';

// Debounce - waits for input to stop
const debouncedSearch = debounce((query) => {
  handleSearch(query);
}, 300); // 300ms delay

// Throttle - limits frequency
const throttledScroll = throttle((event) => {
  handleScroll(event);
}, 500); // max once every 500ms

// Batch execute with concurrency
const results = await batchExecute(
  itemIds,
  (id) => fetchItem(id),
  5 // max 5 concurrent
);
```

### 3. Infinite Scroll Hook

```javascript
import { useInfiniteScroll } from './utils/useIntersectionHooks.js';

const { sentinelRef, isLoading } = useInfiniteScroll({
  onLoadMore: async () => {
    await loadMoreBooks();
  },
  threshold: 300, // 300px before bottom
});

// In JSX
{hasMore && <div ref={sentinelRef}>
  {isLoading ? 'Loading...' : 'Scroll for more'}
</div>}
```

### 4. Paginated Data Fetching

```javascript
import { usePaginatedFetch } from './utils/useFetchHooks.js';

const {
  items,
  loading,
  hasMore,
  error,
  loadMore,
  reset,
} = usePaginatedFetch(
  async (cursor, pageSize) => {
    const result = await listBooks({
      communityId,
      pageSize,
      cursor,
    });
    return result; // Must return { items, nextCursor }
  },
  [communityId]
);
```

### 5. Batch Fetching Hook

```javascript
import { useBatchFetch } from './utils/useFetchHooks.js';

const { data, loading, error } = useBatchFetch(
  bookIds,
  (id) => getBook(id),
  { concurrency: 5, cacheTTL: 5 * 60 * 1000 }
);
```

### 6. Virtual Lists

```javascript
import { VirtualList, VirtualListVariable } from './components/VirtualList.jsx';

// Fixed height items
<VirtualList
  items={books}
  itemHeight={100}
  containerHeight={500}
  renderItem={(book) => <BookCard book={book} />}
  overscan={3}
/>

// Variable height items
<VirtualListVariable
  items={books}
  itemHeights={[100, 120, 100, ...]}
  containerHeight={500}
  renderItem={(book) => <BookCard book={book} />}
/>
```

---

## Common Patterns

### Pattern 1: Search with Debouncing and Caching

```javascript
const [search, setSearch] = useState('');
const [results, setResults] = useState([]);

const performSearch = useMemo(() =>
  debounce(async (query) => {
    const cacheKey = `search:${query}`;
    
    if (cacheService.has(cacheKey)) {
      setResults(cacheService.get(cacheKey));
      return;
    }

    const res = await searchBooks(query);
    cacheService.set(cacheKey, res, 5 * 60 * 1000);
    setResults(res);
  }, 300),
  []
);

const handleSearchChange = (query) => {
  setSearch(query);
  performSearch(query);
};
```

### Pattern 2: List with Infinite Scroll and Ratings

```javascript
const [books, setBooks] = useState([]);
const [cursor, setCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const result = await listBooks({
    communityId,
    pageSize: 25,
    cursor,
  });

  // Batch fetch ratings
  const ratingMap = await listRatingsForBooks(
    result.items.map(b => b.id)
  );

  const withRatings = result.items.map(b => ({
    ...b,
    rating: ratingMap[b.id].average,
    ratingCount: ratingMap[b.id].count,
  }));

  setBooks(prev => [...prev, ...withRatings]);
  setCursor(result.nextCursor);
  setHasMore(result.hasMore);
};

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: loadMore,
  threshold: 300,
});
```

### Pattern 3: Batch Operations with Concurrency

```javascript
import { mergeUniqueArrays } from './utils/performanceHelpers.js';

const [savedBooks, setSavedBooks] = useState([]);

useEffect(() => {
  const ids = user?.savedBookIds || [];
  if (ids.length === 0) return;

  getBooksByIds(ids, 5) // 5 concurrent
    .then(books => {
      setSavedBooks(books);
      // Also update cache
      cacheService.set(`saved:${user.id}`, books, 5 * 60 * 1000);
    });
}, [user?.savedBookIds]);
```

---

## Performance Checklist

- [ ] Use caching for repeated queries
- [ ] Debounce search/filter inputs (300ms)
- [ ] Batch fetch related data
- [ ] Implement pagination for large lists
- [ ] Use infinite scroll instead of "load more" button
- [ ] Limit concurrent requests (max 5)
- [ ] Cache invalidation on mutations
- [ ] Use virtual lists for 100+ items
- [ ] Monitor cache hit rate

---

## Debug Tips

```javascript
// Check cache size
console.log(cacheService.getStats());

// Monitor API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch:', args[0]);
  return originalFetch(...args);
};

// Check rendering
React.Profiler // Use React DevTools Profiler tab

// Virtual list debugging
// Look for overscan value (3 by default)
// Check for jank on scroll (use Performance tab)
```

---

## When to Use Each Utility

| Utility | Use Case | TTL |
|---------|----------|-----|
| cacheService | Any data that repeats | 3-10 min |
| debounce | Search, filters, resize | N/A |
| throttle | Scroll, frequent events | N/A |
| useInfiniteScroll | Large lists | N/A |
| usePaginatedFetch | Books, posts, users | Cached |
| useBatchFetch | Multiple IDs at once | 5 min |
| VirtualList | 100+ items | N/A |

---

## Common Mistakes to Avoid

❌ **Wrong**: Not invalidating cache on mutations
```javascript
// This leaves stale data
await updateBook(id, changes);
// Cache still has old data!
```

✅ **Right**: Clear cache after mutations
```javascript
await updateBook(id, changes);
cacheService.clearPattern('books:');
```

---

❌ **Wrong**: Not debouncing search
```javascript
<input onChange={(e) => setSearch(e.target.value)} />
// Triggers request per keystroke!
```

✅ **Right**: Debounce the search
```javascript
<input onChange={(e) => debouncedSearch(e.target.value)} />
```

---

❌ **Wrong**: Rendering all items at once
```javascript
<ul>
  {allBooks.map(b => <BookCard book={b} />)}
</ul>
// Slow with 1000+ items
```

✅ **Right**: Use virtual list
```javascript
<VirtualList items={allBooks} renderItem={book => <BookCard {...} />} />
```

---

## Performance Targets

- Initial load: < 2 seconds
- Search results: < 300ms (debounced)
- Infinite scroll: Smooth (60fps)
- Memory usage: < 50MB for 1000 items
- Cache hit rate: > 70%

---

## Testing Virtual Lists

```javascript
// Test with large dataset
const largeList = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Book ${i}`,
}));

<VirtualList
  items={largeList}
  itemHeight={100}
  containerHeight={500}
  renderItem={item => <div>{item.name}</div>}
/>

// Scroll and check:
// - No lag
// - Smooth 60fps
// - Memory stable
```

---

## Support Files

- See `PERFORMANCE_OPTIMIZATION.md` for detailed docs
- See `PERFORMANCE_IMPLEMENTATION_SUMMARY.md` for implementation details
- Check individual utility files for JSDoc comments
