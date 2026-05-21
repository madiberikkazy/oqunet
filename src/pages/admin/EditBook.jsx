import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import Avatar from "../../components/Avatar.jsx";
import { getBook, updateBook, listUsersByCommunity } from "../../firebase/firestore.js";
import { uploadImage } from "../../firebase/storage.js";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { t, GENRES } from "../../utils/i18n.js";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='#dde5ee'/><text x='50%' y='52%' text-anchor='middle' fill='#5b6573' font-family='Inter' font-size='9'>OquNet</text></svg>`
  );

export default function EditBook() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { community } = useCommunity();
  const coverRef      = useRef(null);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);
  const [members, setMembers]       = useState([]);
  const [showOwner, setShowOwner]   = useState(false);

  // form mirrors the book document
  const [form, setForm] = useState({
    name: "", author: "", year: "", maxDays: 14,
    description: "", ownerId: "", coverUrl: "", status: "available", genre: "",
  });
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  // load book + community members
  useEffect(() => {
    (async () => {
      const book = await getBook(id);
      if (!book) { navigate(-1); return; }
      setForm({
        name:        book.name        || "",
        author:      book.author      || "",
        year:        book.year        || "",
        maxDays:     book.maxDays     ?? 14,
        description: book.description || "",
        ownerId:     book.ownerId     || "",
        coverUrl:    book.coverUrl    || "",
        status:      book.status      || "available",
        genre:       book.genre       || "",
      });
      if (community?.id) setMembers(await listUsersByCommunity(community.id));
      setLoading(false);
    })();
  }, [id, community?.id]);

  function onPickCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (saving) return;
    if (!form.name.trim() || !form.author.trim()) {
      setError("Введите название и автора");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      let coverUrl = form.coverUrl;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, `books/${id}_${Date.now()}`);
      }
      await updateBook(id, { ...form, coverUrl });
      setForm((f) => ({ ...f, coverUrl }));
      setCoverFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const coverSrc = coverPreview || form.coverUrl || FALLBACK;
  const ownerMember = members.find((m) => m.id === form.ownerId);

  if (loading) {
    return (
      <MobileShell withNav={false}>
        <p className="px-6 py-12 text-center text-ink-500">{t.loading}</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell withNav={false}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-1">
        <button onClick={() => navigate(-1)} className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold flex-1 truncate">{t.editBookTitle}</h1>
      </div>

      <div className="px-5 pt-4 pb-10 space-y-5">

        {/* ── Cover photo ── */}
        <div>
          <p className="text-[13px] text-ink-500 mb-2">{t.bookPhoto}</p>
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="relative w-full h-52 rounded-2xl overflow-hidden bg-ink-100 group focus:outline-none"
          >
            <img src={coverSrc} alt="" className="w-full h-full object-cover" />
            {/* camera overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.6" />
              </svg>
            </div>
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onPickCover} />
          <input
            value={form.coverUrl}
            onChange={(e) => { upd("coverUrl", e.target.value); setCoverPreview(null); setCoverFile(null); }}
            placeholder={t.orPasteUrl}
            className="input mt-2 text-[13px]"
          />
        </div>

        {/* ── Basic info ── */}
        <div className="space-y-3">
          <div>
            <label className="text-[13px] text-ink-500 mb-1 block">{t.name}</label>
            <input
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="text-[13px] text-ink-500 mb-1 block">{t.author}</label>
            <input
              value={form.author}
              onChange={(e) => upd("author", e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] text-ink-500 mb-1 block">{t.year}</label>
              <select value={form.year} onChange={(e) => upd("year", e.target.value)} className="input">
                <option value="">—</option>
                {Array.from({ length: 120 }, (_, i) => 2025 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] text-ink-500 mb-1 block">{t.maxDays}</label>
              <input
                type="number" min="1" max="365"
                value={form.maxDays}
                onChange={(e) => upd("maxDays", Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] text-ink-500 mb-1 block">{t.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => upd("description", e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows="4"
              className="input"
            />
          </div>
        </div>

        {/* ── Genre ── */}
        <div>
          <label className="text-[13px] text-ink-500 mb-2 block">{t.genre}</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "kz" : "kz";
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => upd("genre", form.genre === g.value ? "" : g.value)}
                  className={
                    "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors " +
                    (form.genre === g.value
                      ? "bg-brand-500 text-white"
                      : "bg-ink-100 text-ink-700")
                  }
                >
                  {g[lang] ?? g.kz}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Status ── */}
        <div>
          <label className="text-[13px] text-ink-500 mb-2 block">{t.status}</label>
          <div className="flex gap-2">
            {[
              { v: "available",   label: t.statusAvailable },
              { v: "unavailable", label: t.statusUnavailable },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => upd("status", opt.v)}
                className={
                  "px-4 py-2 rounded-xl text-[14px] font-medium transition " +
                  (form.status === opt.v
                    ? "bg-brand-500 text-white"
                    : "bg-ink-100 text-ink-700")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Owner picker ── */}
        <div>
          <label className="text-[13px] text-ink-500 mb-2 block">{t.owner}</label>
          <button
            type="button"
            onClick={() => setShowOwner((v) => !v)}
            className="w-full flex items-center gap-3 bg-ink-100 rounded-xl px-4 py-3 text-left"
          >
            {ownerMember ? (
              <>
                <Avatar
                  src={ownerMember.photoURL}
                  name={`${ownerMember.firstName} ${ownerMember.lastName}`}
                  size={32}
                />
                <span className="flex-1 text-[14px] font-medium">
                  {ownerMember.firstName} {ownerMember.lastName}
                </span>
              </>
            ) : (
              <span className="flex-1 text-[14px] text-ink-500">
                {t.whoHasIt}
              </span>
            )}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              className={"text-ink-400 transition-transform " + (showOwner ? "rotate-180" : "")}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {showOwner ? (
            <ul className="mt-1 border border-ink-100 rounded-xl overflow-hidden bg-surface divide-y divide-ink-100 max-h-60 overflow-y-auto">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => { upd("ownerId", m.id); setShowOwner(false); }}
                    className={
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition " +
                      (form.ownerId === m.id ? "bg-brand-50" : "hover:bg-ink-100/60")
                    }
                  >
                    <Avatar
                      src={m.photoURL}
                      name={`${m.firstName} ${m.lastName}`}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[12px] text-ink-500">@{m.nickname}</p>
                    </div>
                    {form.ownerId === m.id ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand-500 shrink-0">
                        <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              ))}
              {members.length === 0 ? (
                <li className="px-4 py-6 text-center text-ink-500 text-[13px]">Нет участников</li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {/* ── Feedback ── */}
        {error   ? <p className="text-bad text-[13px]">{error}</p>   : null}
        {success ? <p className="text-ok  text-[13px]">{t.bookSaved}</p> : null}

        {/* ── Save ── */}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "…" : t.save}
        </button>

      </div>
    </MobileShell>
  );
}
