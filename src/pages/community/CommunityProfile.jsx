import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Avatar from "../../components/Avatar.jsx";
import {
  getCommunity, listUsersByCommunity, listPostsByCommunity,
} from "../../firebase/firestore.js";

export default function CommunityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");

  useEffect(() => {
    (async () => {
      setCommunity(await getCommunity(id));
      setMembers(await listUsersByCommunity(id));
      setPosts(await listPostsByCommunity(id));
    })();
  }, [id]);

  if (!community) return <MobileShell><p className="px-6 py-12 text-center text-ink-500">Загрузка...</p></MobileShell>;

  return (
    <MobileShell>
      <SearchBar value="" onChange={() => {}} onBack={() => navigate(-1)} showFilter={false} />

      <div className="flex flex-col items-center pt-4">
        <Avatar src={community.photoURL} name={community.name} size={92} />
        <h2 className="font-bold text-xl mt-3">{community.name}</h2>
        <p className="text-ink-500 text-[14px]">@{community.nickname}</p>
        <p className="text-ink-500 text-[13px] mt-1">{members.length} участников</p>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => setTab("posts")} className={"flex-1 py-2 rounded-xl text-[14px] font-medium " + (tab === "posts" ? "bg-brand-500 text-white" : "bg-ink-100")}>Публикации</button>
        <button onClick={() => setTab("members")} className={"flex-1 py-2 rounded-xl text-[14px] font-medium " + (tab === "members" ? "bg-brand-500 text-white" : "bg-ink-100")}>Участники</button>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {tab === "posts" ? (
          posts.length === 0 ? <p className="text-center text-ink-500 py-8">Публикаций ещё нет.</p>
            : posts.map((p) => (
              <div key={p.id} className="card p-4">
                <h4 className="font-semibold">{p.title}</h4>
                <p className="text-[14px] text-ink-700 mt-1 whitespace-pre-wrap">{p.body}</p>
              </div>
            ))
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id}>
                <Link to={`/users/${m.id}`} className="flex items-center gap-3 px-3 py-2 card">
                  <Avatar src={m.photoURL} name={`${m.firstName} ${m.lastName}`} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[14px] truncate">{m.firstName} {m.lastName}</p>
                    <p className="text-[12px] text-ink-500 truncate">@{m.nickname}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
