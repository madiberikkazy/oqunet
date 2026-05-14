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
} from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [book, setBook] = useState(null);
  const [owner, setOwner] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expand, setExpand] = useState(false);

  useEffect(() => {
    (async () => {
      const b = await getBook(id); setBook(b);
      if (b?.ownerId) setOwner(await getUserById(b.ownerId));
      setRatings(await listRatingsForBook(id));
      setReviews(await listReviewsForBook(id));
    })();
  }, [id]);

  const saved = (user?.savedBookIds || []).includes(id);

  async function toggleSaved() {
    const set = new Set(user.savedBookIds || []);
    if (saved) set.delete(id); else set.add(id);
    await updateUser(user.id, { savedBookIds: [...set] });
    refresh();
  }

  if (!book) {
    return <MobileShell><p className="px-6 py-12 text-ink-500 text-center">Загрузка...</p></MobileShell>;
  }

  const ratingCount = ratings.length;
  const ratingAvg = ratingCount ? ratings.reduce((s, r) => s + r.value, 0) / ratingCount : 0;
  const canBorrow = book.status === "available" && book.ownerId !== user.id;

  return (
    <MobileShell>
      <SearchBar value="" onChange={() => {}} onBack={() => navigate(-1)} placeholder="Search..." />

      <div className="px-4 pt-4 flex gap-3">
        <img src={book.coverUrl} alt={book.name} className="w-[110px] h-[145px] rounded-lg object-cover bg-ink-100" />
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold leading-tight">{book.name}</h1>
          <p className="text-[15px] text-ink-500 mt-1">{book.author}</p>
          <div className="mt-3"><BookStatusBadge status={book.status} daysLeft={book.daysLeft} /></div>
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

      {owner && book.ownerId !== user.id ? (
        <section className="px-4 mt-5">
          <h3 className="section-title mb-2">Владелец</h3>
          <Link to={`/users/${owner.id}`} className="card flex items-center gap-3 px-3 py-3">
            <Avatar src={owner.photoURL} name={`${owner.firstName} ${owner.lastName}`} />
            <div className="flex-1">
              <p className="font-medium">{owner.firstName} {owner.lastName}</p>
              <p className="text-[13px] text-ink-500">@{owner.nickname}</p>
            </div>
          </Link>
        </section>
      ) : null}

      <div className="px-4 mt-6">
        <button disabled={!canBorrow} onClick={() => navigate(`/books/${id}/request`)} className="btn-primary">
          {t.borrowBook}
        </button>
        {!canBorrow && book.ownerId !== user.id ? (
          <p className="text-center text-[12px] text-ink-500 mt-2">Книга сейчас недоступна</p>
        ) : null}
      </div>
    </MobileShell>
  );
}
