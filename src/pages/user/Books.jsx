import { useEffect, useMemo, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import BookCard from "../../components/BookCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listBooks, updateUser, listRatingsForBook } from "../../firebase/firestore.js";

export default function Books() {
  const { user, refresh } = useAuth();
  const { community } = useCommunity();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!community?.id) { setBooks([]); return; }
    listBooks({ communityId: community.id, search, status: filter }).then(async (rows) => {
      const withRatings = await Promise.all(rows.map(async (b) => {
        const rs = await listRatingsForBook(b.id);
        const ratingCount = rs.length;
        const rating = ratingCount ? rs.reduce((s, r) => s + (r.value || 0), 0) / ratingCount : 0;
        return { ...b, rating, ratingCount };
      }));
      setBooks(withRatings);
    });
  }, [community?.id, search, filter]);

  const savedSet = useMemo(() => new Set(user?.savedBookIds || []), [user?.savedBookIds]);

  async function onSaveToggle(book) {
    const next = new Set(savedSet);
    if (next.has(book.id)) next.delete(book.id); else next.add(book.id);
    await updateUser(user.id, { savedBookIds: [...next] });
    refresh();
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
        <SearchBar value={search} onChange={setSearch} onFilterClick={() => setFilterOpen(true)} />
      </div>

      {books.length === 0 ? (
        <EmptyState title="Книг пока нет" subtitle="Когда участники начнут делиться книгами, они появятся здесь." />
      ) : (
        <ul className="mt-2">
          {books.map((b) => (
            <li key={b.id}><BookCard book={b} saved={savedSet.has(b.id)} onSaveToggle={onSaveToggle} /></li>
          ))}
        </ul>
      )}

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр">
        <div className="space-y-2">
          {[
            { v: null, label: "Все книги" },
            { v: "available", label: "Доступные сейчас" },
            { v: "soon", label: "Скоро освободятся" },
            { v: "unavailable", label: "Сейчас на руках" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => { setFilter(opt.v); setFilterOpen(false); }}
              className={"w-full text-left px-4 py-3 rounded-xl transition " + (filter === opt.v ? "bg-brand-50 text-brand-700" : "bg-ink-100")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Modal>
    </MobileShell>
  );
}
