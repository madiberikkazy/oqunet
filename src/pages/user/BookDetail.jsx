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

  useEffect(() => {
    (async () => {
      const b = await getBook(id);
      setBook(b);
      if (b?.ownerId) setOwner(await getUserById(b.ownerId));
      setRatings(await listRatingsForBook(id));
      setReviews(await listReviewsForBook(id));

      // Load who physically has the book:
      // unavailable → active borrower (current holder)
      // available   → last person who returned it (most recent completed borrowing)
      if (b?.status === "unavailable") {
        const borrowing = await getActiveBorrowingByBook(id);
        if (borrowing?.borrowerId) {
          setCurrentHolder(await getUserById(borrowing.borrowerId));
        }
      } else {
        const last = await getLastCompletedBorrowingByBook(id);
        if (last?.borrowerId) {
          setCurrentHolder(await getUserById(last.borrowerId));
        }
      }

      // Load any existing pending pickup request for this user+book.
      // We do NOT auto-redirect — the user stays on BookDetail and sees
      // a "Continue" button. This prevents the infinite redirect loop.
      if (user?.id) {
        const existing = await getPickupRequest(id, user.id);
        setPickupRequest(existing || null);
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

  if (!book) {
    return (
      <MobileShell>
        <p className="px-6 py-12 text-ink-500 text-center">Загрузка...</p>
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
            <BookStatusBadge status={book.status} daysLeft={book.daysLeft} />
            {book.genre ? (
              <span className="pill bg-ink-100 text-ink-700 text-[12px]">
                {genreLabel(book.genre)}
              </span>
            ) : null}
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

      {(() => {
        // Show the person the reader would physically get the book from:
        // - unavailable → current holder (borrower)
        // - available   → owner
        // unavailable → current holder
        // available   → last holder if exists, otherwise owner (never been borrowed yet)
        const person = currentHolder ?? (book.status === "available" ? owner : null);
        const label  = book.status === "unavailable"
          ? "Ұстаушы"
          : currentHolder ? "Соңғы ұстаушы" : "Ұстаушы";
        if (!person || person.id === user?.id) return null;
        return (
          <section className="px-4 mt-5">
            <h3 className="section-title mb-2">{label}</h3>
            <Link to={`/users/${person.id}`} className="card flex items-center gap-3 px-3 py-3">
              <Avatar src={person.photoURL} name={`${person.firstName} ${person.lastName}`} />
              <div className="flex-1">
                <p className="font-medium">{person.firstName} {person.lastName}</p>
                <p className="text-[13px] text-ink-500">@{person.nickname}</p>
              </div>
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
