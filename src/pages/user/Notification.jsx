import { useEffect, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import NotificationItem from "../../components/NotificationItem.jsx";
import {
  listNotifications, deleteNotification, markNotificationRead,
} from "../../firebase/firestore.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { t } from "../../utils/i18n.js";

export default function Notification() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => { if (user) listNotifications(user.id).then(setItems); }, [user?.id]);

  const filtered = items.filter(
    (n) => !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.body?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelected(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function bulkDelete() {
    await Promise.all([...selected].map((id) => deleteNotification(id)));
    setItems(items.filter((n) => !selected.has(n.id)));
    setSelected(new Set()); setSelectMode(false);
  }
  async function bulkMarkRead() {
    await Promise.all([...selected].map((id) => markNotificationRead(id)));
    setItems(items.map((n) => (selected.has(n.id) ? { ...n, read: true } : n)));
    setSelected(new Set()); setSelectMode(false);
  }

  if (items.length === 0) {
    return (
      <MobileShell>
        <EmptyState
          title={t.noNotifications}
          subtitle={t.noNotificationsHint}
          icon={
            <svg width="120" height="120" viewBox="0 0 24 24" fill="#2D6BFF">
              <path d="M12 3a6 6 0 0 0-6 6v3.5L4.5 15a.75.75 0 0 0 .53 1.28h13.94A.75.75 0 0 0 19.5 15L18 12.5V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21Z" />
            </svg>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex items-center gap-2">
        {selectMode ? (
          <div className="flex items-center gap-2 px-4 w-full">
            <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} className="icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="flex-1 font-medium">{selected.size}</span>
            <button onClick={bulkDelete} className="icon-btn" aria-label="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M9 7V4h6v3m-7 0v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button onClick={bulkMarkRead} className="icon-btn" aria-label="Mark read">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 7l9 7 9-7M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} /></div>
        )}
      </div>

      {!selectMode ? (
        <div className="px-4 mt-2 flex justify-end">
          <button onClick={() => setSelectMode(true)} className="text-[13px] text-ink-500">Выбрать</button>
        </div>
      ) : null}

      <ul className="mt-2">
        {filtered.map((n) => (
          <li key={n.id}>
            <NotificationItem notification={n} selectable={selectMode} selected={selected.has(n.id)} onToggle={toggleSelected} />
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-6 py-8 text-center text-ink-500">{t.noResults}</li>
        ) : null}
      </ul>
    </MobileShell>
  );
}
