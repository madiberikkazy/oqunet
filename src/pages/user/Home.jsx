import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listPostsByCommunity, searchCommunities, searchUsers } from "../../firebase/firestore.js";

export default function Home() {
  const { user } = useAuth();
  const { community } = useCommunity();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    if (!community?.id) { setPosts([]); return; }
    listPostsByCommunity(community.id).then(setPosts);
  }, [community?.id]);

  useEffect(() => {
    if (!search) { setUsers([]); setCommunities([]); return; }
    Promise.all([searchUsers(search), searchCommunities(search)]).then(([u, c]) => {
      setUsers(u); setCommunities(c);
    });
  }, [search]);

  return (
    <MobileShell>
      <div className="pb-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск пользователей и сообществ" />
      </div>

      {search ? (
        <div className="px-4 mt-2 space-y-3">
          {communities.length > 0 && (
            <section>
              <h3 className="section-title mb-2">Сообщества</h3>
              <ul className="card divide-y divide-ink-100">
                {communities.map((c) => (
                  <li key={c.id}>
                    <Link to={`/community/${c.id}`} className="flex items-center gap-3 px-4 py-3">
                      <Avatar src={c.photoURL} name={c.name} />
                      <div><p className="font-medium">{c.name}</p><p className="text-[13px] text-ink-500">@{c.nickname}</p></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {users.length > 0 && (
            <section>
              <h3 className="section-title mb-2">Пользователи</h3>
              <ul className="card divide-y divide-ink-100">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link to={`/users/${u.id}`} className="flex items-center gap-3 px-4 py-3">
                      <Avatar src={u.photoURL} name={`${u.firstName} ${u.lastName}`} />
                      <div><p className="font-medium">{u.firstName} {u.lastName}</p><p className="text-[13px] text-ink-500">@{u.nickname}</p></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {users.length === 0 && communities.length === 0 ? (
            <p className="text-center text-ink-500 py-8">Ничего не найдено</p>
          ) : null}
        </div>
      ) : !community ? (
        <NoCommunityState />
      ) : (
        <div className="px-4 mt-2">
          <h2 className="text-xl font-bold mb-1">{community.name}</h2>
          <p className="text-[13px] text-ink-500 mb-4">@{community.nickname}</p>
          {posts.length === 0 ? (
            <p className="text-ink-500 py-8 text-center">Пока что нет публикаций</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="card p-4">
                  <h4 className="font-semibold">{p.title}</h4>
                  <p className="text-[14px] text-ink-700 mt-1 whitespace-pre-wrap">{p.body}</p>
                  <p className="text-[12px] text-ink-500 mt-2">{new Date(p.createdAt).toLocaleString("ru-RU")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </MobileShell>
  );
}

function NoCommunityState() {
  return (
    <div className="px-6 pt-12 text-center">
      <div className="w-24 h-24 rounded-full bg-brand-50 mx-auto flex items-center justify-center mb-4">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="text-brand-500">
          <path d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v.5H4v-.5Zm0 3.5h16v1H4v-1Zm0 3h16V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5Z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <h2 className="text-xl font-bold">Вы ещё не в сообществе</h2>
      <p className="text-ink-500 text-[14px] mt-2 max-w-xs mx-auto">
        Чтобы получить доступ к книгам, подайте заявку в существующее сообщество или создайте своё.
      </p>
      <div className="mt-6 space-y-3 max-w-xs mx-auto">
        <Link to="/community/join" className="btn-primary block text-center">Найти сообщество</Link>
        <Link to="/community/create" className="btn-secondary block text-center">Создать сообщество</Link>
      </div>
    </div>
  );
}
