import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import BookStatusBadge from "../../components/BookStatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { getBook, updateUser } from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function SavedBooks() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = user?.savedBookIds || [];
    if (ids.length === 0) { setBooks([]); setLoading(false); return; }
    Promise.all(ids.map((id) => getBook(id))).then((results) => {
      setBooks(results.filter(Boolean));
      setLoading(false);
    });
  }, [user?.savedBookIds]);

  async function unsave(bookId, e) {
    e.stopPropagation();
    const next = (user.savedBookIds || []).filter((id) => id !== bookId);
    await updateUser(user.id, { savedBookIds: next });
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    refresh();
  }

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="icon-btn shrink-0" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-bold text-[18px]">{t.saved}</h1>
        {books.length > 0 && (
          <span className="ml-auto text-[13px] text-ink-400 font-medium">{books.length}</span>
        )}
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">{t.loading}</p>
      ) : books.length === 0 ? (
        <EmptyState title="Сақталған кітаптар жоқ" subtitle="Кітапты сақтау үшін жүрек белгісін басыңыз." />
      ) : (
        <ul className="px-4 divide-y divide-ink-100">
          {books.map((book) => (
            <li
              key={book.id}
              onClick={() => navigate(`/books/${book.id}`)}
              className="flex items-center gap-3 py-3 cursor-pointer active:bg-ink-100/40 transition rounded-xl px-1"
            >
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.name} className="w-10 h-14 rounded-lg object-cover bg-ink-100 shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded-lg bg-ink-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] truncate">{book.name}</p>
                <p className="text-[13px] text-ink-500 truncate">{book.author}</p>
                <div className="mt-1"><BookStatusBadge status={book.status} /></div>
              </div>
              {/* Unsave button */}
              <button
                onClick={(e) => unsave(book.id, e)}
                className="shrink-0 p-2 rounded-xl hover:bg-ink-100 transition active:scale-95"
                aria-label="Unsave"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand-500">
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </MobileShell>
  );
}
