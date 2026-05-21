import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import Avatar from "../../components/Avatar.jsx";
import Modal from "../../components/Modal.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { listUsersByCommunity, updateUser } from "../../firebase/firestore.js";

export default function AdminMembers() {
  const { user: adminUser } = useAuth();
  const { community } = useCommunity();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null); // member to delete
  const [removing, setRemoving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!community?.id) { setLoading(false); return; }
    listUsersByCommunity(community.id).then((rows) => {
      setMembers(rows);
      setLoading(false);
    });
  }, [community?.id]);

  async function handleRemove() {
    if (!confirmTarget || removing) return;
    setRemoving(true);
    try {
      await updateUser(confirmTarget.id, { communityId: null });
      setMembers((prev) => prev.filter((m) => m.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(false);
    }
  }

  const filtered = members.filter((m) => {
    const s = search.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(s) ||
      m.lastName?.toLowerCase().includes(s) ||
      m.nickname?.toLowerCase().includes(s)
    );
  });

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="icon-btn shrink-0" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-bold text-[18px] flex-1">Участники</h1>
        <span className="text-[13px] text-ink-400 font-medium">{members.length}</span>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Іздеу..."
            className="w-full bg-ink-100 rounded-2xl pl-9 pr-4 py-2.5 text-[14px] placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">Жүктелуде...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-ink-400 text-[14px] mt-10">Участников не найдено.</p>
      ) : (
        <ul className="px-4 divide-y divide-ink-100">
          {filtered.map((member) => {
            const isAdmin = member.id === adminUser?.id;
            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => navigate(`/users/${member.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition"
                >
                  <Avatar
                    src={member.photoURL}
                    name={`${member.firstName} ${member.lastName}`}
                    size={44}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[15px] truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      {isAdmin && (
                        <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          Вы
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-ink-500 truncate">@{member.nickname}</p>
                  </div>
                </button>

                {/* Remove button — hidden for the admin themselves */}
                {!isAdmin && (
                  <button
                    onClick={() => setConfirmTarget(member)}
                    className="shrink-0 p-2 rounded-xl text-bad hover:bg-bad/10 active:scale-95 transition"
                    aria-label="Remove member"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Confirm removal modal */}
      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Участникты жою">
        {confirmTarget && (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-ink-100">
              <Avatar
                src={confirmTarget.photoURL}
                name={`${confirmTarget.firstName} ${confirmTarget.lastName}`}
                size={40}
              />
              <div className="min-w-0">
                <p className="font-semibold text-[15px] truncate">
                  {confirmTarget.firstName} {confirmTarget.lastName}
                </p>
                <p className="text-[13px] text-ink-500">@{confirmTarget.nickname}</p>
              </div>
            </div>
            <p className="text-[14px] text-ink-600 mb-5 leading-relaxed">
              Бұл пайдаланушы сіздің қауымдастықтан алынып тасталады. Ол қайтадан кіру өтінішін бере алады.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-ink-100 text-ink-700 transition hover:bg-ink-200"
              >
                Болдырмау
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-bad text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {removing ? "…" : "Жою"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </MobileShell>
  );
}
