import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import BookCard from "../../components/BookCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLang } from "../../contexts/LanguageContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listBooks, updateUser, listRatingsForBooks } from "../../firebase/firestore.js";
import { t, GENRES, genreLabel } from "../../utils/i18n.js";
import { debounce, mergeUniqueArrays } from "../../utils/performanceHelpers.js";
import { cacheService } from "../../utils/cacheService.js";
import { useInfiniteScroll } from "../../utils/useIntersectionHooks.js";

const STATUS_OPTIONS = [
  { v: null,          labelKey: "allBooks"          },
  { v: "available",   labelKey: "statusAvailable"   },
  { v: "soon",        labelKey: "statusSoon"        },
  { v: "unavailable", labelKey: "statusUnavailable" },
];

const PAGE_SIZE = 25; // Load 25 items per page
const CACHE_TTL = 3 * 60 * 1000; // Cache for 3 minutes

export default function Books() {
  const { user, refresh } = useAuth();
  const { community } = useCommunity();
  useLang();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [genres, setGenres] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Pagination state
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Draft state for filters
  const [draftStatus, setDraftStatus] = useState(null);
  const [draftGenres, setDraftGenres] = useState([]);

  const isFilterActive = status !== null || genres.length > 0;

  // Generate cache key for current filters
  const getCacheKey = useCallback(() => {
    return `books:${community?.id || ""}:${search}:${status || ""}:${genres.join(",")}`;
  }, [community?.id, search, status, genres]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => {
      setBooks([]);
      setCursor(null);
      setHasMore(true);
      // Clear cache for this search
      cacheService.clearPattern(`books:${community?.id || ""}`);
    }, 300),
    [community?.id]
  );

  // Initial load and on filter change
  useEffect(() => {
    if (!community?.id) {
      setBooks([]);
      setLoadingInitial(false);
      return;
    }

    const loadInitial = async () => {
      setLoadingInitial(true);
      setCursor(null);
      setBooks([]);
      setHasMore(true);

      const cacheKey = getCacheKey();
      let cachedBooks = cacheService.get(cacheKey);

      if (cachedBooks) {
        setBooks(cachedBooks);
        setLoadingInitial(false);
        return;
      }

      try {
        const result = await listBooks({
          communityId: community.id,
          search,
          status,
          genres,
          pageSize: PAGE_SIZE,
        });

        let itemsWithRatings = result.items || [];

        // Batch fetch ratings for all books
        if (itemsWithRatings.length > 0) {
          try {
            const ratingMap = await listRatingsForBooks(
              itemsWithRatings.map((b) => b.id),
              5 // concurrency
            );

            itemsWithRatings = itemsWithRatings.map((b) => ({
              ...b,
              rating: ratingMap[b.id]?.average || 0,
              ratingCount: ratingMap[b.id]?.count || 0,
            }));
          } catch (ratingError) {
            console.error("Error fetching ratings:", ratingError);
            // Continue without ratings if they fail to load
            itemsWithRatings = itemsWithRatings.map((b) => ({
              ...b,
              rating: 0,
              ratingCount: 0,
            }));
          }
        }

        // Cache the result
        cacheService.set(cacheKey, itemsWithRatings, CACHE_TTL);

        setBooks(itemsWithRatings);
        setCursor(result.nextCursor || null);
        setHasMore(result.hasMore || false);
      } catch (error) {
        console.error("Failed to load books:", error);
        setBooks([]);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitial();
  }, [community?.id, search, status, genres, getCacheKey]);

  // Load more handler for infinite scroll
  const loadMore = useCallback(async () => {
    if (!community?.id || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const result = await listBooks({
        communityId: community.id,
        search,
        status,
        genres,
        pageSize: PAGE_SIZE,
        cursor,
      });

      let newItems = result.items || [];

      // Batch fetch ratings for new items
      if (newItems.length > 0) {
        try {
          const ratingMap = await listRatingsForBooks(
            newItems.map((b) => b.id),
            5 // concurrency
          );

          newItems = newItems.map((b) => ({
            ...b,
            rating: ratingMap[b.id]?.average || 0,
            ratingCount: ratingMap[b.id]?.count || 0,
          }));
        } catch (ratingError) {
          console.error("Error fetching ratings for load more:", ratingError);
          // Continue without ratings
          newItems = newItems.map((b) => ({
            ...b,
            rating: 0,
            ratingCount: 0,
          }));
        }
      }

      setBooks((prev) => mergeUniqueArrays(prev, newItems));
      setCursor(result.nextCursor || null);
      setHasMore(result.hasMore || false);

      // Update cache
      const cacheKey = getCacheKey();
      const cachedBooks = cacheService.get(cacheKey) || [];
      const updatedBooks = mergeUniqueArrays(cachedBooks, newItems);
      cacheService.set(cacheKey, updatedBooks, CACHE_TTL);
    } catch (error) {
      console.error("Failed to load more books:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [community?.id, search, status, genres, cursor, hasMore, loadingMore, getCacheKey]);

  // Infinite scroll sentinel
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    threshold: 300,
  });

  const savedSet = useMemo(() => new Set(user?.savedBookIds || []), [user?.savedBookIds]);

  async function onSaveToggle(book) {
    const next = new Set(savedSet);
    if (next.has(book.id)) next.delete(book.id); else next.add(book.id);
    await updateUser(user.id, { savedBookIds: [...next] });
    refresh();
  }

  function removeGenre(v) { setGenres((prev) => prev.filter((g) => g !== v)); }
  function removeStatus() { setStatus(null); }

  function openFilter() {
    setDraftStatus(status);
    setDraftGenres([...genres]);
    setFilterOpen(true);
  }

  function applyFilter() {
    setStatus(draftStatus);
    setGenres(draftGenres);
    setFilterOpen(false);
  }

  function resetDraft() {
    setDraftStatus(null);
    setDraftGenres([]);
  }

  function toggleDraftGenre(value) {
    setDraftGenres((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  }

  function handleSearchChange(newSearch) {
    setSearch(newSearch);
    debouncedSearch(newSearch);
  }

  if (!community) {
    return (
      <MobileShell>
        <EmptyState title="Books недоступны" subtitle="Вступите в сообщество, чтобы видеть книги." />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="pb-2">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onFilterClick={openFilter}
          filterActive={isFilterActive}
        />
      </div>

      {/* Active filter chips */}
      {isFilterActive ? (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {status ? (
            <Chip
              label={t[STATUS_OPTIONS.find((o) => o.v === status)?.labelKey] ?? status}
              onRemove={removeStatus}
            />
          ) : null}
          {genres.map((g) => (
            <Chip key={g} label={genreLabel(g)} onRemove={() => removeGenre(g)} />
          ))}
        </div>
      ) : null}

      {loadingInitial ? (
        <EmptyState title="Загрузка..." subtitle="" />
      ) : books.length === 0 ? (
        <EmptyState title="Книг пока нет" subtitle="Когда участники начнут делиться книгами, они появятся здесь." />
      ) : (
        <ul className="mt-2">
          {books.map((b) => (
            <li key={b.id}>
              <BookCard book={b} saved={savedSet.has(b.id)} onSaveToggle={onSaveToggle} />
            </li>
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <li ref={sentinelRef} className="py-4 text-center">
              {loadingMore ? (
                <p className="text-ink-400 text-[14px]">{t.loading || "Загрузка..."}</p>
              ) : (
                <p className="text-ink-400 text-[13px]">Прокрутите для загрузки больше</p>
              )}
            </li>
          )}
        </ul>
      )}

      {/* ── Filter modal ── */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title={t.filterTitle} scrollable>
        {/* Status — single select */}
        <div className="mb-5">
          <p className="text-[13px] text-ink-500 mb-2">{t.status}</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={String(opt.v)}
                onClick={() => setDraftStatus(opt.v)}
                className={
                  "px-4 py-2 rounded-xl text-[14px] font-medium transition " +
                  (draftStatus === opt.v
                    ? "bg-brand-500 text-white"
                    : "bg-ink-100 text-ink-700")
                }
              >
                {t[opt.labelKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Genre — multi-select */}
        <div className="mb-5">
          <p className="text-[13px] text-ink-500 mb-2">{t.genre}</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "kz" : "kz";
              const selected = draftGenres.includes(g.value);
              return (
                <button
                  key={g.value}
                  onClick={() => toggleDraftGenre(g.value)}
                  className={
                    "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors " +
                    (selected ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-700")
                  }
                >
                  {g[lang] ?? g.kz}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={resetDraft}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-ink-100 text-ink-700 transition"
          >
            {t.filterReset}
          </button>
          <button
            onClick={applyFilter}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white transition"
          >
            {t.filterApply}
          </button>
        </div>
      </Modal>
    </MobileShell>
  );
}

// ─── Small removable chip ──────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-brand-50 text-brand-700 text-[13px] font-medium">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-brand-200 flex items-center justify-center hover:bg-brand-300 transition"
        aria-label="Remove filter"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
