import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { listBorrowingsForUser } from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function CompletedBooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    listBorrowingsForUser(user.id, "completed").then((rows) => {
      // newest first
      rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setItems(rows);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="icon-btn shrink-0" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-bold text-[18px]">{t.completed}</h1>
        {items.length > 0 && (
          <span className="ml-auto text-[13px] text-ink-400 font-medium">{items.length}</span>
        )}
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">{t.loading}</p>
      ) : items.length === 0 ? (
        <EmptyState title="Оқылған кітаптар жоқ" subtitle="Кітапты аяқтағаннан кейін осында көрінеді." />
      ) : (
        <ul className="px-4 divide-y divide-ink-100">
          {items.map((b) => (
            <li
              key={b.id}
              onClick={() => navigate(`/books/${b.bookId}`)}
              className="flex items-center gap-3 py-3 cursor-pointer active:bg-ink-100/40 transition rounded-xl px-1"
            >
              <div className="w-10 h-14 rounded-lg bg-ok/10 shrink-0 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-ok">
                  <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] truncate">{b.bookName}</p>
                {b.returnDate ? (
                  <p className="text-[12px] text-ink-500 mt-0.5">
                    Аяқталды: {new Date(b.returnDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                ) : null}
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
