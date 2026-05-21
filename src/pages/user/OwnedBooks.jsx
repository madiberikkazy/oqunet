import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import BookStatusBadge from "../../components/BookStatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listBooks } from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function OwnedBooks() {
  const { user } = useAuth();
  const { community } = useCommunity();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !community?.id) { setLoading(false); return; }
    listBooks({ communityId: community.id }).then((rows) => {
      // "Books you currently have" = books you physically hold right now:
      // 1. You own it AND it's available (not lent out) → you have it
      // 2. You're the active borrower (borrowerId === you) → you have it
      const yours = rows.filter(
        (b) =>
          (b.ownerId === user.id && b.status !== "unavailable") ||
          (b.borrowerId === user.id && b.status === "unavailable")
      );
      setBooks(yours);
      setLoading(false);
    });
  }, [user?.id, community?.id]);

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="icon-btn shrink-0" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-bold text-[18px]">{t.ownedBooks}</h1>
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">{t.loading}</p>
      ) : books.length === 0 ? (
        <EmptyState title="Кітаптар жоқ" subtitle="Сіз қауымдастыққа кітап қоспадыңыз." />
      ) : (
        <ul className="px-4 space-y-0 divide-y divide-ink-100">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-300 shrink-0">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </MobileShell>
  );
}
