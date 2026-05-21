import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  listBorrowingsForUser, updateBorrowing, updateBook, createNotification,
} from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function ReadingNow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [borrowing, setBorrowing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    listBorrowingsForUser(user.id, "active").then((rows) => {
      setBorrowing(rows[0] || null);
      setLoading(false);
    });
  }, [user?.id]);

  async function handleFinish() {
    if (!borrowing || finishing) return;
    setFinishing(true);
    try {
      await updateBorrowing(borrowing.id, { status: "completed" });
      await updateBook(borrowing.bookId, { status: "available", borrowerId: null });
      if (borrowing.ownerId && borrowing.ownerId !== user.id) {
        await createNotification({
          recipientId: borrowing.ownerId,
          title: "Кітап қайтарылды",
          body: `${user.firstName} ${user.lastName} сіздің «${borrowing.bookName}» кітабыңызды қайтарды.`,
          read: false,
          type: "book-returned",
          bookId: borrowing.bookId,
        });
      }
      setBorrowing(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishing(false);
    }
  }

  const daysLeft = borrowing
    ? Math.max(0, Math.ceil((borrowing.returnDate - Date.now()) / 86400000))
    : 0;
  const progressPct = borrowing
    ? Math.min(100, Math.max(0,
        ((Date.now() - borrowing.startDate) /
         (borrowing.returnDate - borrowing.startDate)) * 100
      ))
    : 0;

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="icon-btn shrink-0" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-bold text-[18px]">{t.readingNow}</h1>
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">{t.loading}</p>
      ) : !borrowing ? (
        <EmptyState title="Оқып жатқан кітап жоқ" subtitle="Кітапхананы ашып, бір кітап алыңыз." />
      ) : (
        <div className="px-4 space-y-4">
          {/* Book card */}
          <div
            onClick={() => navigate(`/books/${borrowing.bookId}`)}
            className="card flex items-center gap-4 px-4 py-4 cursor-pointer active:scale-[0.99] transition"
          >
            {borrowing.coverUrl ? (
              <img src={borrowing.coverUrl} alt={borrowing.bookName} className="w-14 h-20 rounded-xl object-cover bg-ink-100 shrink-0" />
            ) : (
              <div className="w-14 h-20 rounded-xl bg-ink-100 shrink-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-ink-300">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[16px] leading-snug">{borrowing.bookName}</p>
              {borrowing.bookAuthor ? (
                <p className="text-[13px] text-ink-500 mt-0.5">{borrowing.bookAuthor}</p>
              ) : null}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-300 shrink-0">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Progress widget */}
          <div className="card px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-ink-600 font-medium">Қалған күндер</p>
              <span className="text-[32px] font-bold text-brand-500 leading-none">{daysLeft}</span>
            </div>

            <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[12px] text-ink-400">
              <span>
                {borrowing.startDate
                  ? new Date(borrowing.startDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
                  : "—"}
              </span>
              <span>
                {borrowing.returnDate
                  ? new Date(borrowing.returnDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
                  : "—"}
              </span>
            </div>
          </div>

          {/* Finish button */}
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-3.5 rounded-2xl bg-bad text-white font-semibold text-[15px] active:scale-[0.99] transition disabled:opacity-60"
          >
            {finishing ? "…" : "Аяқтау"}
          </button>
        </div>
      )}
    </MobileShell>
  );
}
