import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listBorrowingsForUser, listBooks } from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function Profile() {
  const { user } = useAuth();
  const { community } = useCommunity();
  const [stats, setStats] = useState({ owned: 0, reading: 0, completed: 0, saved: 0 });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const reading = await listBorrowingsForUser(user.id, "active");
      const completed = await listBorrowingsForUser(user.id, "completed");
      const owned = community?.id
        ? (await listBooks({ communityId: community.id })).filter((b) => b.ownerId === user.id)
        : [];
      setStats({
        owned: owned.length,
        reading: reading.length,
        completed: completed.length,
        saved: (user.savedBookIds || []).length,
      });
    })();
  }, [user?.id, community?.id]);

  return (
    <MobileShell>
      <div className="flex justify-end px-4">
        <Link to="/settings" className="icon-btn" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.43 16.96l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.62.99 1 1.65 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col items-center pt-2">
        <Avatar src={user?.photoURL} name={`${user?.firstName} ${user?.lastName}`} size={92} />
        <h2 className="font-bold text-xl mt-3">{user?.firstName} {user?.lastName}</h2>
        <p className="text-ink-500 text-[14px]">@{user?.nickname}</p>
      </div>

      <div className="px-4 mt-5">
        {community ? (
          <Link to={`/community/${community.id}`} className="flex items-center gap-3 border-2 border-brand-200 rounded-2xl px-3 py-3">
            <Avatar src={community.photoURL} name={community.name} size={44} />
            <div><p className="font-medium">{community.name}</p><p className="text-[13px] text-ink-500">@{community.nickname}</p></div>
          </Link>
        ) : (
          <Link to="/community/join" className="btn-primary block text-center">Найти сообщество</Link>
        )}
      </div>

      <div className="px-4 mt-5 grid grid-cols-2 gap-3">
        <Card color="bg-[#F4ECFA]" icon="user" title={t.ownedBooks} desc="Эти книги доступны другим участникам." value={stats.owned} />
        <Card color="bg-[#E5F7F0]" icon="calendar" title={t.readingNow} desc={stats.reading > 0 ? "Активная книга" : "Сейчас не читаете книгу"} value={stats.reading} />
        <Card color="bg-[#FDECEC]" icon="check" title={t.completed} desc="Книги, которые вы прочли." value={stats.completed} />
        <Card color="bg-[#FDE9F0]" icon="heart" title={t.saved} desc="Сохранённые книги." value={stats.saved} />
      </div>
    </MobileShell>
  );
}

function Card({ color, icon, title, desc, value }) {
  return (
    <div className={"rounded-2xl p-4 " + color}>
      <div className="text-ink-700 mb-2">{renderIcon(icon)}</div>
      <h4 className="font-semibold text-[14px] leading-tight">{title}</h4>
      <p className="text-[12px] text-ink-500 mt-1 line-clamp-2">{desc}</p>
      <p className="text-[20px] font-bold mt-2">{value}</p>
    </div>
  );
}

function renderIcon(icon) {
  if (icon === "user") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c.6-3.4 3.5-6 7-6s6.4 2.6 7 6" stroke="currentColor" strokeWidth="1.6" /></svg>;
  if (icon === "calendar") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M4 10h16M8 4v4M16 4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
  if (icon === "check") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" /><path d="m8 12 3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === "heart") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
  return null;
}
