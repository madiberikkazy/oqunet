import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import BookStatusBadge from "../../components/BookStatusBadge.jsx";
import SaveButton from "../../components/SaveButton.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getBook, getUserById, listRatingsForBook, listReviewsForBook, updateUser,
  getPickupRequest, createPickupRequest,
  getActiveBorrowingByBook, getLastCompletedBorrowingByBook, createNotification,
  updateBook, updateBorrowing,
} from "../../firebase/firestore.js";
import { t, genreLabel } from "../../utils/i18n.js";

function makeCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh, viewRole } = useAuth();
  const [book, setBook]             = useState(null);
  const [owner, setOwner]           = useState(null);
  const [currentHolder, setCurrentHolder] = useState(null);
  const [ratings, setRatings]       = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [expand, setExpand]         = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [pickupRequest, setPickupRequest] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [daysLeft, setDaysLeft]     = useState(null);
  const [borrowingMaxDays, setBorrowingMaxDays] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("BookDetail: Loading book with id:", id);

        const b = await getBook(id);
        console.log("BookDetail: Got book:", b);
        
        if (!b) {
          console.log("BookDetail: Book not found");
          setError("Кітап табылмады");
          setLoading(false);
          return;
        }
        
        setBook(b);
        
        if (b?.ownerId) {
          try {
            const ownerData = await getUserById(b.ownerId);
            if (ownerData) setOwner(ownerData);
          } catch (err) {
            console.error("Error loading owner:", err);
          }
        }
        
        try {
          const ratingsData = await listRatingsForBook(id);
          setRatings(ratingsData || []);
        } catch (err) {
          console.error("Error loading ratings:", err);
          setRatings([]);
        }
        
        try {
          const reviewsData = await listReviewsForBook(id);
          setReviews(reviewsData || []);
        } catch (err) {
          console.error("Error loading reviews:", err);
          setReviews([]);
        }

        if (b?.status === "unavailable") {
          try {
            const borrowing = await getActiveBorrowingByBook(id);
            if (borrowing) {
              // Compute days left
              if (borrowing.returnDate) {
                const retTs = typeof borrowing.returnDate === "number"
                  ? borrowing.returnDate
                  : new Date(borrowing.returnDate).getTime();
                const remaining = Math.ceil((retTs - Date.now()) / 86400000);
                const startTs = borrowing.startDate?.toMillis?.() ?? borrowing.startDate ?? Date.now();
                const totalDays = Math.ceil((retTs - startTs) / 86400000);
                setBorrowingMaxDays(totalDays);

                if (remaining <= 0) {
                  // Auto-return: booking days expired
                  await updateBook(id, { status: "available", borrowerId: null, holderId: null });
                  await updateBorrowing(borrowing.id, { status: "completed" });
                  b.status = "available";
                  setBook({ ...b, status: "available" });
                  setDaysLeft(null);
                } else {
                  setDaysLeft(remaining);
                }
              }

              if (b.status === "unavailable" && borrowing.borrowerId) {
                const holderData = await getUserById(borrowing.borrowerId);
                if (holderData) setCurrentHolder(holderData);
              }
            }
          } catch (err) {
            console.error("Error loading current holder:", err);
          }
        } else {
          try {
            const last = await getLastCompletedBorrowingByBook(id);
            if (last?.borrowerId) {
              const holderData = await getUserById(last.borrowerId);
              if (holderData) setCurrentHolder(holderData);
            }
          } catch (err) {
            console.error("Error loading last holder:", err);
          }
        }

        // Load any existing pending pickup request for this user+book.
        if (user?.id) {
          try {
            const existing = await getPickupRequest(id, user.id);
            setPickupRequest(existing || null);
          } catch (err) {
            console.error("Error loading pickup request:", err);
          }
        }

        console.log("BookDetail: Finished loading all data");
        setLoading(false);
      } catch (err) {
        console.error("Error loading book detail:", err);
        setError("Қателік: кітапты жүктеу мүмкін болмады");
        setLoading(false);
      }
    })();
  }, [id, user?.id]);

  const saved = (user?.savedBookIds || []).includes(id);

  async function toggleSaved() {
    const set = new Set(user.savedBookIds || []);
    if (saved) set.delete(id); else set.add(id);
    await updateUser(user.id, { savedBookIds: [...set] });
    refresh();
  }

  /**
   * User taps "Получить книгу" — only called when there is NO existing request.
   *
   * Unavailable: create pickup request → notify current holder with their code.
   * Available:   generate a fresh code → store in pickup request → notify owner.
   *
   * Book is only marked "unavailable" AFTER the borrower enters the correct code
   * in PickupBook.jsx.
   */
  async function requestPickup() {
    if (!user || !book) return;
    // Safety: if a request already exists just navigate to pickup page
    if (pickupRequest) {
      navigate(`/books/${id}/pickup`);
      return;
    }
    setRequesting(true);
    try {
      if (book.status === "unavailable") {
        const borrowing = await getActiveBorrowingByBook(id);

        const req = await createPickupRequest({
          bookId: id,
          bookName: book.name,
          requesterId: user.id,
          requesterName: `${user.firstName} ${user.lastName}`,
        });
        setPickupRequest(req);

        if (borrowing?.borrowerId && borrowing.borrowerId !== user.id) {
          await createNotification({
            recipientId: borrowing.borrowerId,
            title: "Хотят забрать вашу книгу",
            body: `${user.firstName} ${user.lastName} хочет получить книгу «${book.name}», которую вы держите. Если он заберёт книгу — сообщите ему код для смены читателя.`,
            read: false,
            type: "pickup-request",
            bookId: id,
            pickupCode: borrowing.pickupCode,
          });
        }
      } else {
        const newCode = makeCode();

        const req = await createPickupRequest({
          bookId: id,
          bookName: book.name,
          requesterId: user.id,
          requesterName: `${user.firstName} ${user.lastName}`,
          pickupCode: newCode,
        });
        setPickupRequest(req);

        if (book.ownerId && book.ownerId !== user.id) {
          await createNotification({
            recipientId: book.ownerId,
            title: "Запрос на книгу",
            body: `${user.firstName} ${user.lastName} хочет взять вашу книгу «${book.name}». Назовите ему код для передачи:`,
            read: false,
            type: "borrow-request",
            bookId: id,
            pickupCode: newCode,
          });
        }
      }

      navigate(`/books/${id}/pickup`);
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <MobileShell>
        <p className="px-6 py-12 text-ink-500 text-center">Жүктелуде...</p>
      </MobileShell>
    );
  }

  if (error || !book) {
    return (
      <MobileShell>
        <div className="px-4 py-12 text-center">
          <p className="text-ink-500 mb-4">{error || "Кітап табылмады"}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Артқа қайту
          </button>
        </div>
      </MobileShell>
    );
  }

  const ratingCount = ratings.length;
  const ratingAvg   = ratingCount
    ? ratings.reduce((s, r) => s + r.value, 0) / ratingCount
    : 0;

  const isAdminView = viewRole === "admin";
  const isOwner     = book.ownerId === user?.id;

  return (
    <MobileShell>
      <SearchBar value="" onChange={() => {}} onBack={() => navigate(-1)} placeholder="Search..." />

      <div className="px-4 pt-4 flex gap-3">
        <img
          src={book.coverUrl} alt={book.name}
          className="w-[110px] h-[145px] rounded-lg object-cover bg-ink-100"
        />
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold leading-tight">{book.name}</h1>
          <p className="text-[15px] text-ink-500 mt-1">{book.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <BookStatusBadge status={book.status} daysLeft={daysLeft} />
            {book.genre ? (
              <span className="pill bg-ink-100 text-ink-700 text-[12px]">
                {genreLabel(book.genre)}
              </span>
            ) : null}
            {(book.genres || []).filter((g) => g !== book.genre).map((g) => (
              <span key={g} className="pill bg-ink-100 text-ink-700 text-[12px]">
                {genreLabel(g)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <button
          onClick={toggleSaved}
          className="w-full bg-ink-100 hover:bg-ink-100/80 rounded-xl py-3.5 font-medium flex items-center justify-center gap-2"
        >
          {t.saveBtn}
          <SaveButton saved={saved} onClick={(e) => e.preventDefault()} />
        </button>
      </div>

      <section className="px-4 mt-5">
        <h3 className="section-title">{t.bookDescription}</h3>
        <p className={"text-[14px] text-ink-700 mt-2 whitespace-pre-wrap " + (expand ? "" : "line-clamp-3")}>
          {book.description || "—"}
        </p>
        {book.description && book.description.length > 100 ? (
          <button onClick={() => setExpand((x) => !x)} className="text-brand-500 text-[13px] mt-1">
            {expand ? "Скрыть" : "Подробнее"}
          </button>
        ) : null}
      </section>

      {/* Days left countdown */}
      {book.status === "unavailable" && daysLeft != null && (
        <section className="px-4 mt-5">
          <div className={"rounded-2xl px-4 py-4 flex items-center gap-4 " +
            (daysLeft <= 3 ? "bg-badSoft" : daysLeft <= 7 ? "bg-warnSoft" : "bg-brand-50")}>
            <div className={"w-14 h-14 rounded-xl flex items-center justify-center text-[22px] font-bold " +
              (daysLeft <= 3 ? "bg-bad text-white" : daysLeft <= 7 ? "bg-warn text-white" : "bg-brand-500 text-white")}>
              {daysLeft}
            </div>
            <div>
              <p className="font-semibold text-[15px]">
                {daysLeft === 1 ? "1 күн қалды" : `${daysLeft} күн қалды`}
              </p>
              <p className="text-[13px] text-ink-500">
                {borrowingMaxDays ? `${borrowingMaxDays} күннен` : ""} — қайтару мерзімі
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 mt-5 flex items-center justify-between">
        <div>
          <h3 className="section-title">{t.rating}</h3>
          <div className="flex items-center gap-1 mt-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5B100">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.5 1.2 6.6L12 17.4 6.1 20.5l1.2-6.6L2.5 9.4l6.6-.9L12 2.5z" />
            </svg>
            <span className="font-semibold">{ratingAvg.toFixed(1)}</span>
          </div>
          <p className="text-[12px] text-ink-500 mt-0.5">{ratingCount} бағалау</p>
        </div>
      </section>

      <section className="px-4 mt-5">
        <h3 className="section-title mb-2">{t.reviews}</h3>
        {reviews.length === 0 ? (
          <p className="text-[13px] text-ink-500">Пока что нет отзывов.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="bg-ink-100/60 rounded-xl p-3 flex gap-2">
                <Avatar src={r.photoURL} name={r.authorName} size={32} />
                <p className="text-[13px] text-ink-700 flex-1">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Owner — who added the book, never changes */}
      {owner && owner.id !== user?.id && (
        <section className="px-4 mt-5">
          <h3 className="section-title mb-2">Иесі</h3>
          <Link to={`/users/${owner.id}`} className="card flex items-center gap-3 px-3 py-3">
            <Avatar src={owner.photoURL} name={`${owner.firstName} ${owner.lastName}`} />
            <div className="flex-1">
              <p className="font-medium">{owner.firstName} {owner.lastName}</p>
              <p className="text-[13px] text-ink-500">@{owner.nickname}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-300">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </section>
      )}

      {/* Holder — who physically has the book right now */}
      {(() => {
        // available → owner is the holder (book not lent out)
        // unavailable → currentHolder (active borrower)
        const holder = book.status === "unavailable" ? currentHolder : owner;
        if (!holder || holder.id === user?.id) return null;
        // Don't repeat if holder === owner and we already showed owner above
        if (book.status === "available" && owner && holder.id === owner.id) return null;
        return (
          <section className="px-4 mt-5">
            <h3 className="section-title mb-2">Ұстаушы</h3>
            <Link to={`/users/${holder.id}`} className="card flex items-center gap-3 px-3 py-3">
              <Avatar src={holder.photoURL} name={`${holder.firstName} ${holder.lastName}`} />
              <div className="flex-1">
                <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                <p className="text-[13px] text-ink-500">@{holder.nickname}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-300">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </section>
        );
      })()}

      <div className="px-4 mt-6 mb-2">
        {isAdminView ? (
          <p className="text-center text-[13px] text-ink-500 py-3 bg-ink-100 rounded-xl">
            Администраторы не могут брать книги. Переключитесь в режим пользователя.
          </p>
        ) : isOwner ? (
          <p className="text-center text-[13px] text-ink-500 py-3 bg-ink-100 rounded-xl">
            Это ваша книга.
          </p>
        ) : pickupRequest ? (
          /* Already requested — show a resume button, no new code is generated */
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/books/${id}/pickup`)}
              className="btn-primary"
            >
              Продолжить получение книги →
            </button>
            <p className="text-[12px] text-ink-500 text-center">
              Код уже отправлен. Введите его на следующей странице.
            </p>
          </div>
        ) : book.status === "unavailable" ? (
          <button
            onClick={requestPickup}
            disabled={requesting}
            className="btn-primary"
          >
            {requesting ? "…" : "Получить книгу"}
          </button>
        ) : (
          <button
            onClick={requestPickup}
            disabled={requesting}
            className="btn-primary"
          >
            {requesting ? "…" : t.borrowBook}
          </button>
        )}
      </div>
    </MobileShell>
  );
}
