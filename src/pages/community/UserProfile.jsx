import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Avatar from "../../components/Avatar.jsx";
import BookCard from "../../components/BookCard.jsx";
import { getUserById, listBooks, getCommunity } from "../../firebase/firestore.js";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState(null);
  const [community, setCommunity] = useState(null);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    (async () => {
      const user = await getUserById(id); setU(user);
      if (user?.communityId) {
        setCommunity(await getCommunity(user.communityId));
        const all = await listBooks({ communityId: user.communityId });
        setBooks(all.filter((b) => b.ownerId === user.id));
      }
    })();
  }, [id]);

  if (!u) return <MobileShell><p className="px-6 py-12 text-center text-ink-500">Загрузка...</p></MobileShell>;

  return (
    <MobileShell>
      <SearchBar value="" onChange={() => {}} onBack={() => navigate(-1)} showFilter={false} />
      <div className="flex flex-col items-center pt-4">
        <Avatar src={u.photoURL} name={`${u.firstName} ${u.lastName}`} size={92} />
        <h2 className="font-bold text-xl mt-3">{u.firstName} {u.lastName}</h2>
        <p className="text-ink-500 text-[14px]">@{u.nickname}</p>
        {community ? <p className="text-[13px] text-ink-500 mt-1">из {community.name}</p> : null}
      </div>

      <section className="px-4 mt-5">
        <h3 className="section-title mb-2">Книги участника</h3>
        {books.length === 0 ? (
          <p className="text-[13px] text-ink-500">Книг не добавил.</p>
        ) : (
          <ul>{books.map((b) => (<li key={b.id}><BookCard book={b} /></li>))}</ul>
        )}
      </section>
    </MobileShell>
  );
}
