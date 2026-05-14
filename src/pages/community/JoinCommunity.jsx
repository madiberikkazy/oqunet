import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Avatar from "../../components/Avatar.jsx";
import {
  createJoinRequest, createNotification, getActiveBorrowingForUser,
  listCommunities, searchCommunities,
} from "../../firebase/firestore.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { t } from "../../utils/i18n.js";

export default function JoinCommunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [bookForm, setBookForm] = useState({ name: "", author: "", description: "", coverUrl: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (search ? searchCommunities(search) : listCommunities()).then(setCommunities);
  }, [search]);

  async function submit(e) {
    e.preventDefault(); setError("");
    if (!bookForm.name.trim()) { setError("Укажите книгу, которую внесёте в сообщество"); return; }
    const active = await getActiveBorrowingForUser(user.id);
    if (active) { setError("Сначала верните взятую книгу."); return; }
    setSubmitting(true);
    try {
      const req = await createJoinRequest({
        userId: user.id, userNickname: user.nickname,
        communityId: selected.id, bookName: bookForm.name,
        bookAuthor: bookForm.author, bookDescription: bookForm.description,
        bookCoverUrl: bookForm.coverUrl,
      });
      await createNotification({
        recipientId: selected.ownerId,
        title: "Қоғамдастыққа кіруге ұсыныс",
        body: `@${user.nickname} подал заявку. Книга: «${bookForm.name}»`,
        read: false, type: "join-request",
        communityId: selected.id, requestId: req.id,
      });
      alert("Заявка отправлена. Ждите ответа админа.");
      navigate("/", { replace: true });
    } catch (err) { setError(err?.message || "Ошибка"); }
    finally { setSubmitting(false); }
  }

  return (
    <MobileShell withNav={false}>
      <div className="flex items-center gap-2 px-4">
        <button onClick={() => navigate(-1)} className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h1 className="text-lg font-semibold">Подать заявку</h1>
      </div>

      <SearchBar value={search} onChange={setSearch} showFilter={false} />

      {!selected ? (
        <ul className="mt-3 card mx-4 divide-y divide-ink-100">
          {communities.length === 0 ? (
            <li className="px-6 py-8 text-center text-ink-500">
              {search ? "Ничего не найдено" : "Пока что нет сообществ. Создайте первое!"}
            </li>
          ) : (
            communities.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSelected(c)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  <Avatar src={c.photoURL} name={c.name} size={42} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-[13px] text-ink-500 truncate">@{c.nickname}</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <form onSubmit={submit} className="px-5 pt-3 space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <Avatar src={selected.photoURL} name={selected.name} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selected.name}</p>
              <p className="text-[13px] text-ink-500 truncate">@{selected.nickname}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-[13px] text-brand-500">Сменить</button>
          </div>

          <h3 className="section-title mt-2">{t.contributedBook}</h3>
          <input value={bookForm.name} onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })} placeholder="Название книги" className="input" />
          <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} placeholder="Автор" className="input" />
          <input value={bookForm.coverUrl} onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })} placeholder="URL обложки (опционально)" className="input" />
          <textarea value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} rows="3" placeholder="Что важно знать арендатору" className="input" />
          {error ? <p className="text-bad text-[13px]">{error}</p> : null}
          <button disabled={submitting} className="btn-primary">
            {submitting ? "..." : "Отправить заявку"}
          </button>
        </form>
      )}
    </MobileShell>
  );
}
