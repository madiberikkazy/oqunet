import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import {
  getBook,
  getUserById,
  getActiveBorrowingByBook,
  getActiveBorrowingForUser,
  createBorrowing,
  updateBorrowing,
  updateBook,
  createNotification,
} from "../../firebase/firestore.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

// Generate a random 4-digit string like "4823"
function makeCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmt(d) { return new Date(d).toISOString().slice(0, 10); }

export default function PickupBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [currentHolder, setCurrentHolder] = useState(null);   // user who currently holds the book
  const [existingBorrowing, setExistingBorrowing] = useState(null); // active borrowing doc
  const [returnDate, setReturnDate] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  // Whether a pickup-request notification has already been sent this session
  const notifSentRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const b = await getBook(id);
      setBook(b);

      const maxDays = b?.maxDays || 14;
      setReturnDate(fmt(addDays(Date.now(), Math.min(7, maxDays))));

      if (b?.status === "unavailable") {
        // Find who currently holds it
        const borrowing = await getActiveBorrowingByBook(id);
        setExistingBorrowing(borrowing);
        if (borrowing?.borrowerId) {
          const holder = await getUserById(borrowing.borrowerId);
          setCurrentHolder(holder);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  // Send a one-time notification to the current holder with the code
  useEffect(() => {
    if (!existingBorrowing || !currentHolder || notifSentRef.current) return;
    if (!user) return;
    notifSentRef.current = true;

    // Only notify if the requester is different from the current holder
    if (currentHolder.id === user.id) return;

    createNotification({
      recipientId: currentHolder.id,
      title: "Запрос на передачу книги",
      body: `${user.firstName} ${user.lastName} хочет получить книгу «${existingBorrowing.bookName || book?.name}», которую вы держите. Если вы передадите книгу — сообщите ему код: ${existingBorrowing.pickupCode}`,
      read: false,
      type: "pickup-request",
      bookId: id,
      pickupCode: existingBorrowing.pickupCode,
    });
  }, [existingBorrowing, currentHolder, user]);

  // Handle digit input — auto-advance to next box
  function handleDigit(index, value) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 3) {
      document.getElementById(`digit-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const enteredCode = digits.join("");
    if (enteredCode.length < 4) {
      setError("Введите 4-значный код");
      return;
    }

    // Case 1: book is unavailable — verify code against existing borrowing
    if (existingBorrowing) {
      if (enteredCode !== existingBorrowing.pickupCode) {
        setError("Неверный код. Попросите текущего читателя сообщить вам код.");
        return;
      }

      setSubmitting(true);
      try {
        const active = await getActiveBorrowingForUser(user.id);
        if (active) {
          setError("Сначала верните взятую вами книгу.");
          return;
        }

        // Generate a fresh code for the next handover
        const newCode = makeCode();

        // Close the previous borrowing
        await updateBorrowing(existingBorrowing.id, { status: "completed" });

        // Create a new borrowing for this user
        await createBorrowing({
          bookId: id,
          bookName: book.name,
          borrowerId: user.id,
          ownerId: book.ownerId,
          communityId: book.communityId,
          startDate: Date.now(),
          returnDate: new Date(returnDate).getTime(),
          status: "active",
          pickupCode: newCode,
        });

        await updateBook(id, { status: "unavailable", borrowerId: user.id });

        // Notify book owner
        await createNotification({
          recipientId: book.ownerId,
          title: "Книга передана новому читателю",
          body: `«${book.name}» теперь у ${user.firstName} ${user.lastName} (@${user.nickname}).`,
          read: false,
          type: "book-transferred",
          bookId: id,
        });

        navigate(`/books/${id}`, { replace: true });
      } catch (err) {
        setError(err?.message || "Ошибка");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Case 2: book is available (owner is handing it out for the first time)
    // No code needed — but we still need a return date check.
    // Generate first pickup code.
    setSubmitting(true);
    try {
      const active = await getActiveBorrowingForUser(user.id);
      if (active) {
        setError("Сначала верните взятую вами книгу.");
        return;
      }
      if (book.ownerId === user.id) {
        setError("Это ваша книга.");
        return;
      }

      const maxDate = addDays(Date.now(), book.maxDays || 14);
      if (new Date(returnDate) > maxDate) {
        setError(`Максимальный срок — ${book.maxDays || 14} дней.`);
        return;
      }

      const newCode = makeCode();

      await createBorrowing({
        bookId: id,
        bookName: book.name,
        borrowerId: user.id,
        ownerId: book.ownerId,
        communityId: book.communityId,
        startDate: Date.now(),
        returnDate: new Date(returnDate).getTime(),
        status: "active",
        pickupCode: newCode,
      });

      await updateBook(id, { status: "unavailable", borrowerId: user.id });

      await createNotification({
        recipientId: book.ownerId,
        title: "Запрос на книгу",
        body: `${user.firstName} ${user.lastName} берёт вашу книгу «${book.name}» до ${returnDate}.`,
        read: false,
        type: "borrow-request",
        bookId: id,
      });

      navigate(`/books/${id}`, { replace: true });
    } catch (err) {
      setError(err?.message || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !book) {
    return (
      <MobileShell withNav={false}>
        <p className="px-6 py-12 text-center text-ink-500">Загрузка...</p>
      </MobileShell>
    );
  }

  const isUnavailable = book.status === "unavailable";

  return (
    <MobileShell withNav={false}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-2">
        <button onClick={() => navigate(-1)} className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold truncate">Получить книгу</h1>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Book info */}
        <div className="card p-4 flex gap-3">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.name}
              className="w-14 h-20 rounded-md object-cover bg-ink-100 shrink-0" />
          ) : null}
          <div className="min-w-0">
            <p className="font-semibold text-[15px] truncate">{book.name}</p>
            <p className="text-[13px] text-ink-500 truncate">{book.author}</p>
          </div>
        </div>

        {isUnavailable ? (
          /* Book is currently with someone — user must enter the code */
          <>
            <div className="rounded-2xl bg-warnSoft px-4 py-3 text-[13px] text-warn leading-relaxed">
              Эта книга сейчас у другого читателя
              {currentHolder ? ` (@${currentHolder.nickname})` : ""}.
              Когда вы физически получите книгу, попросите его назвать вам 4-значный код.
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <p className="section-title mb-3">Введите код от текущего читателя</p>
                <div className="flex gap-3 justify-center">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      id={`digit-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-14 h-16 text-center text-2xl font-bold rounded-2xl bg-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="section-title mb-1">Дата возврата</p>
                <input
                  type="date"
                  value={returnDate}
                  min={fmt(Date.now())}
                  max={fmt(addDays(Date.now(), book.maxDays || 14))}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="input"
                />
                <p className="text-[12px] text-ink-500 mt-1">
                  Максимум {book.maxDays || 14} дней
                </p>
              </div>

              {error ? <p className="text-bad text-[13px]">{error}</p> : null}

              <button disabled={submitting} className="btn-primary">
                {submitting ? "..." : "Подтвердить получение"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Отмена
              </button>
            </form>
          </>
        ) : (
          /* Book is available — no code needed, just pick a return date */
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-2xl bg-okSoft px-4 py-3 text-[13px] text-ok">
              Книга свободна. Выберите дату возврата и подтвердите получение.
            </div>

            <div>
              <p className="section-title mb-1">Дата возврата</p>
              <input
                type="date"
                value={returnDate}
                min={fmt(Date.now())}
                max={fmt(addDays(Date.now(), book.maxDays || 14))}
                onChange={(e) => setReturnDate(e.target.value)}
                className="input"
              />
              <p className="text-[12px] text-ink-500 mt-1">
                Максимум {book.maxDays || 14} дней
              </p>
            </div>

            {error ? <p className="text-bad text-[13px]">{error}</p> : null}

            <button disabled={submitting} className="btn-primary">
              {submitting ? "..." : "Подтвердить получение"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Отмена
            </button>
          </form>
        )}
      </div>
    </MobileShell>
  );
}