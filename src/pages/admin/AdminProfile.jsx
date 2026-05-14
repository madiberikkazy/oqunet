import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listPostsByCommunity, listUsersByCommunity } from "../../firebase/firestore.js";

export default function AdminProfile() {
  const { user } = useAuth();
  const { community } = useCommunity();
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!community?.id) return;
    listPostsByCommunity(community.id).then(setPosts);
    listUsersByCommunity(community.id).then(setMembers);
  }, [community?.id]);

  return (
    <MobileShell>
      <div className="flex justify-end px-4">
        <Link to="/settings" className="icon-btn" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
      <div className="flex flex-col items-center">
        <Avatar src={user?.photoURL} name={`${user?.firstName} ${user?.lastName}`} size={92} />
        <h2 className="font-bold text-xl mt-3">{user?.firstName} {user?.lastName}</h2>
        <p className="text-ink-500 text-[14px]">@{user?.nickname}</p>
        <span className="mt-2 pill bg-brand-50 text-brand-700">Админ</span>
      </div>

      {community ? (
        <Link to={`/community/${community.id}`} className="mx-4 mt-5 flex items-center gap-3 border-2 border-brand-200 rounded-2xl px-3 py-3">
          <Avatar src={community.photoURL} name={community.name} size={44} />
          <div><p className="font-medium">{community.name}</p><p className="text-[13px] text-ink-500">@{community.nickname}</p></div>
        </Link>
      ) : null}

      <section className="px-4 mt-5">
        <h3 className="section-title mb-2">Публикации сообщества ({posts.length})</h3>
        {posts.length === 0 ? (
          <p className="text-ink-500 text-[13px]">Публикаций ещё нет.</p>
        ) : (
          <ul className="space-y-2">
            {posts.slice(0, 3).map((p) => (
              <li key={p.id} className="card p-3">
                <p className="font-medium text-[14px]">{p.title}</p>
                <p className="text-[12px] text-ink-500 truncate">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 mt-5">
        <h3 className="section-title mb-2">Участники ({members.length})</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-2 card">
              <Avatar src={m.photoURL} name={`${m.firstName} ${m.lastName}`} size={36} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[14px] truncate">{m.firstName} {m.lastName}</p>
                <p className="text-[12px] text-ink-500 truncate">@{m.nickname}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </MobileShell>
  );
}
