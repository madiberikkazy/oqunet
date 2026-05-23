import { useEffect, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Fab from "../../components/Fab.jsx";
import Modal from "../../components/Modal.jsx";
import NotificationItem from "../../components/NotificationItem.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import {
  createNotification, listJoinRequests, listNotifications,
  listUsersByCommunity, updateJoinRequest,
} from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function AdminNotification() {
  const { user } = useAuth();
  const { community } = useCommunity();

  const [items, setItems]             = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);  // pending join requests
  const [search, setSearch]           = useState("");
  const [sendOpen, setSendOpen]       = useState(false);
  const [members, setMembers]         = useState([]);
  const [form, setForm]               = useState({ recipientId: "", title: "", body: "" });
  const [loading, setLoading]         = useState(true);
  const [busy, setBusy]               = useState(null); // requestId currently being processed

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id).then(setItems).finally(() => setLoading(false));
    if (community?.id) {
      listJoinRequests(community.id).then((rows) =>
        setJoinRequests(rows.filter((r) => r.status === "pending"))
      );
      listUsersByCommunity(community.id).then(setMembers);
    }
  }, [user?.id, community?.id]);

  // Build lookup: requestId → joinRequest (only pending ones)
  const requestMap = {};
  joinRequests.forEach((r) => { requestMap[r.id] = r; });

  async function approve(req) {
    setBusy(req.id);
    try {
      await updateJoinRequest(req.id, { status: "approved" });
      await createNotification({
        recipientId: req.userId,
        title: "Заявка одобрена 🎉",
        body: `Администратор сообщества «${community.name}» одобрил вашу заявку. Хотите вступить?`,
        read: false,
        type: "join-approved",
        communityId: community.id,
        communityName: community.name,
        bookName: req.bookName || "",
        bookAuthor: req.bookAuthor || "",
        bookDescription: req.bookDescription || "",
        bookCoverUrl: req.bookCoverUrl || "",
        confirmed: "pending",
      });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } finally {
      setBusy(null);
    }
  }

  async function reject(req) {
    setBusy(req.id);
    try {
      await updateJoinRequest(req.id, { status: "rejected" });
      await createNotification({
        recipientId: req.userId,
        title: "Заявка отклонена",
        body: `К сожалению, ваша заявка в сообщество «${community?.name}» была отклонена.`,
        read: false,
        type: "join-rejected",
      });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } finally {
      setBusy(null);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!form.recipientId) return;
    await createNotification({
      recipientId: form.recipientId,
      title: form.title,
      body: form.body,
      read: false,
      type: "message",
      senderId: user.id,
    });
    setForm({ recipientId: "", title: "", body: "" });
    setSendOpen(false);
    alert("Отправлено");
  }

  const filtered = items.filter(
    (n) =>
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.body?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileShell>
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск" />

      <section className="mt-2">
        {loading ? (
          <p className="px-6 py-12 text-center text-ink-500">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t.noNotifications}
            subtitle={t.noNotificationsHint}
            icon={
              <svg width="120" height="120" viewBox="0 0 24 24" className="text-brand-500" fill="currentColor">
                <path d="M12 3a6 6 0 0 0-6 6v3.5L4.5 15a.75.75 0 0 0 .53 1.28h13.94A.75.75 0 0 0 19.5 15L18 12.5V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21Z" />
              </svg>
            }
          />
        ) : (
          <ul>
            {filtered.map((n) => {
              // If this is a pending join-request notification → show inline accept/decline
              const req = n.type === "join-request" ? requestMap[n.requestId] : null;

              if (req) {
                const isBusy = busy === req.id;
                const date = n.createdAt
                  ? new Date(n.createdAt?.toMillis?.() ?? n.createdAt)
                      .toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
                  : "";
                return (
                  <li key={n.id} className="px-4 py-4 border-b border-ink-100 last:border-b-0">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-[15px] leading-snug">{n.title}</p>
                      {date ? <span className="text-[11px] text-ink-500 shrink-0 mt-0.5">{date}</span> : null}
                    </div>
                    {/* Body */}
                    <p className="text-[13px] text-ink-500 mb-3 leading-relaxed">{n.body}</p>
                    {/* Inline action buttons */}
                    <div className="flex gap-2">
                      <button
                        disabled={isBusy}
                        onClick={() => approve(req)}
                        className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-[13px] font-semibold active:scale-[0.98] transition disabled:opacity-60"
                      >
                        {isBusy ? "…" : "Одобрить"}
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => reject(req)}
                        className="flex-1 py-2.5 rounded-xl bg-badSoft text-bad text-[13px] font-semibold active:scale-[0.98] transition disabled:opacity-60"
                      >
                        {isBusy ? "…" : "Отклонить"}
                      </button>
                    </div>
                  </li>
                );
              }

              // All other notification types → regular tappable row
              return (
                <li key={n.id}>
                  <NotificationItem notification={n} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Fab onClick={() => setSendOpen(true)} ariaLabel="Send notification" />

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Отправить сообщение">
        <form onSubmit={send} className="space-y-3">
          <select
            value={form.recipientId}
            onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
            className="input"
          >
            <option value="">Кому?</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                @{m.nickname} — {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Тема"
            className="input"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Сообщение"
            rows="4"
            className="input"
          />
          <button className="btn-primary">Отправить</button>
        </form>
      </Modal>
    </MobileShell>
  );
}
