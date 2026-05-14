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
  listUsersByCommunity, updateJoinRequest, updateUser, createBook,
} from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function AdminNotification() {
  const { user } = useAuth();
  const { community } = useCommunity();
  const [items, setItems] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ recipientId: "", title: "", body: "" });

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id).then(setItems);
    if (community?.id) {
      listJoinRequests(community.id).then((rows) => setJoinRequests(rows.filter((r) => r.status === "pending")));
      listUsersByCommunity(community.id).then(setMembers);
    }
  }, [user?.id, community?.id]);

  async function send(e) {
    e.preventDefault();
    if (!form.recipientId) return;
    await createNotification({
      recipientId: form.recipientId, title: form.title, body: form.body,
      read: false, type: "message", senderId: user.id,
    });
    setForm({ recipientId: "", title: "", body: "" });
    setSendOpen(false);
    alert("Отправлено");
  }

  async function approve(req) {
    await updateUser(req.userId, { communityId: community.id });
    if (req.bookName) {
      await createBook({
        communityId: community.id, ownerId: req.userId,
        name: req.bookName, author: req.bookAuthor || "", year: req.bookYear || "",
        description: req.bookDescription || "", maxDays: 14,
        coverUrl: req.bookCoverUrl || "", status: "available", createdAt: Date.now(),
      });
    }
    await updateJoinRequest(req.id, { status: "approved" });
    await createNotification({
      recipientId: req.userId, title: "Заявка одобрена",
      body: `Добро пожаловать в ${community.name}!`, read: false,
      type: "join-approved", communityId: community.id,
    });
    setJoinRequests(joinRequests.filter((r) => r.id !== req.id));
  }

  async function reject(req) {
    await updateJoinRequest(req.id, { status: "rejected" });
    await createNotification({
      recipientId: req.userId, title: "Заявка отклонена",
      body: `К сожалению, в этот раз заявка в ${community?.name} отклонена.`,
      read: false, type: "join-rejected",
    });
    setJoinRequests(joinRequests.filter((r) => r.id !== req.id));
  }

  return (
    <MobileShell>
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск" />

      {joinRequests.length > 0 ? (
        <section className="px-4 mt-3">
          <h3 className="section-title mb-2">Заявки на вступление</h3>
          <ul className="card divide-y divide-ink-100">
            {joinRequests.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <p className="font-medium">@{r.userNickname}</p>
                <p className="text-[13px] text-ink-500">Вносит книгу: «{r.bookName}»</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => approve(r)} className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-[13px] font-medium">Одобрить</button>
                  <button onClick={() => reject(r)} className="flex-1 py-2 bg-badSoft text-bad rounded-lg text-[13px] font-medium">Отклонить</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {items.length === 0 && joinRequests.length === 0 ? (
        <EmptyState
          title={t.noNotifications}
          subtitle={t.noNotificationsHint}
          icon={
            <svg width="120" height="120" viewBox="0 0 24 24" fill="#2D6BFF">
              <path d="M12 3a6 6 0 0 0-6 6v3.5L4.5 15a.75.75 0 0 0 .53 1.28h13.94A.75.75 0 0 0 19.5 15L18 12.5V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21Z" />
            </svg>
          }
        />
      ) : (
        <ul className="mt-2">{items.map((n) => (<li key={n.id}><NotificationItem notification={n} /></li>))}</ul>
      )}

      <Fab onClick={() => setSendOpen(true)} ariaLabel="Send notification" />

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Отправить сообщение">
        <form onSubmit={send} className="space-y-3">
          <select value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })} className="input">
            <option value="">Кому?</option>
            {members.map((m) => (<option key={m.id} value={m.id}>@{m.nickname} — {m.firstName} {m.lastName}</option>))}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Тема" className="input" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Сообщение" rows="4" className="input" />
          <button className="btn-primary">Отправить</button>
        </form>
      </Modal>
    </MobileShell>
  );
}
