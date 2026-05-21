import { useEffect, useMemo, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import BookCard from "../../components/BookCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLang } from "../../contexts/LanguageContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listBooks, updateUser, listRatingsForBook } from "../../firebase/firestore.js";
import { t, GENRES, genreLabel } from "../../utils/i18n.js";

const STATUS_OPTIONS = [
  { v: null,          labelKey: "allBooks"          },
  { v: "available",   labelKey: "statusAvailable"   },
  { v: "soon",        labelKey: "statusSoon"        },
  { v: "unavailable", labelKey: "statusUnavailable" },
];

export default function Books() {
  const { user, refresh } = useAuth();
  const { community } = useCommunity();
  useLang(); // re-render on language change so genre labels update

  const [books, setBooks]         = useState([]);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState(null);       // committed
  const [genres, setGenres]       = useState([]);          // committed — array of genre values
  const [filterOpen, setFilterOpen] = useState(false);

  // draft state — edited inside the modal, applied on "Применить"
  const [draftStatus, setDraftStatus] = useState(null);
  const [draftGenres, setDraftGenres] = useState([]);

  const isFilterActive = status !== null || genres.length > 0;

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

  // Fetch books whenever committed filters or search change
  useEffect(() => {
    if (!community?.id) { setBooks([]); return; }
    listBooks({ communityId: community.id, search, status, genres }).then(async (rows) => {
      const withRatings = await Promise.all(rows.map(async (b) => {
        const rs = await listRatingsForBook(b.id);
        const ratingCount = rs.length;
        const rating = ratingCount ? rs.reduce((s, r) => s + (r.value || 0), 0) / ratingCount : 0;
        return { ...b, rating, ratingCount };
      }));
      setBooks(withRatings);
    });
  }, [community?.id, search, status, genres]);

  const savedSet = useMemo(() => new Set(user?.savedBookIds || []), [user?.savedBookIds]);

  async function onSaveToggle(book) {
    const next = new Set(savedSet);
    if (next.has(book.id)) next.delete(book.id); else next.add(book.id);
    await updateUser(user.id, { savedBookIds: [...next] });
    refresh();
  }

  function removeGenre(v) { setGenres((prev) => prev.filter((g) => g !== v)); }
  function removeStatus() { setStatus(null); }

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
          onChange={setSearch}
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

      {books.length === 0 ? (
        <EmptyState title="Книг пока нет" subtitle="Когда участники начнут делиться книгами, они появятся здесь." />
      ) : (
        <ul className="mt-2">
          {books.map((b) => (
            <li key={b.id}><BookCard book={b} saved={savedSet.has(b.id)} onSaveToggle={onSaveToggle} /></li>
          ))}
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
