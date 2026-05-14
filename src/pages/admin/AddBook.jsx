import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import Stepper from "../../components/Stepper.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import { listUsersByCommunity, createBook } from "../../firebase/firestore.js";
import { uploadImage } from "../../firebase/storage.js";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { t } from "../../utils/i18n.js";

export default function AddBook() {
  const navigate = useNavigate();
  const { community } = useCommunity();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", author: "", year: "", givenAt: "", maxDays: 14,
    description: "", ownerId: "", coverUrl: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (community?.id) listUsersByCommunity(community.id).then(setMembers); }, [community?.id]);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const s = search.toLowerCase();
    return members.filter((m) => m.nickname?.toLowerCase().includes(s));
  }, [members, search]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onNext() {
    setError("");
    if (step === 1) {
      if (!form.name.trim() || !form.author.trim()) { setError("Заполните название и автора"); return; }
    }
    if (step === 2 && !form.ownerId) { setError("Выберите владельца книги"); return; }
    if (step < 3) { setStep(step + 1); return; }

    setSubmitting(true);
    try {
      let coverUrl = form.coverUrl;
      if (coverFile) coverUrl = await uploadImage(coverFile, `books/${Date.now()}_${coverFile.name}`);
      const book = await createBook({
        ...form, coverUrl, communityId: community.id, status: "available", createdAt: Date.now(),
      });
      navigate(`/books/${book.id}`, { replace: true });
    } catch (err) {
      setError(err?.message || "Ошибка создания книги");
    } finally { setSubmitting(false); }
  }

  return (
    <MobileShell withNav={false}>
      <div className="flex items-center gap-2 px-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="flex-1">
          <Stepper step={step} total={3} title={step === 3 ? "Добавление нового объекта" : t.addBookTitle} />
        </div>
        <button onClick={() => navigate(-1)} className="icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="px-5 pt-3 pb-24">
        {step === 1 ? <Step1 form={form} update={update} /> : null}
        {step === 2 ? <Step2 members={filteredMembers} search={search} setSearch={setSearch} selectedId={form.ownerId} onSelect={(id) => update("ownerId", id)} /> : null}
        {step === 3 ? <Step3 coverFile={coverFile} setCoverFile={setCoverFile} coverUrl={form.coverUrl} setCoverUrl={(v) => update("coverUrl", v)} /> : null}
        {error ? <p className="text-bad text-[13px] mt-3">{error}</p> : null}
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-5 z-10">
        <button onClick={onNext} disabled={submitting} className="btn-primary">
          {submitting ? "..." : t.next}
        </button>
      </div>
    </MobileShell>
  );
}

function Step1({ form, update }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{t.basicData}</h2>
      <div className="space-y-3">
        <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={t.name} className="input" />
        <input value={form.author} onChange={(e) => update("author", e.target.value)} placeholder={t.author} className="input" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.year} onChange={(e) => update("year", e.target.value)} className="input">
            <option value="">{t.year}</option>
            {Array.from({ length: 120 }, (_, i) => 2025 - i).map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <input type="number" min="1" max="60" value={form.maxDays} onChange={(e) => update("maxDays", Number(e.target.value))} placeholder={t.maxDays} className="input" />
        </div>
        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.description}</span>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder={t.descriptionPlaceholder} rows="4" className="input" />
        </label>
      </div>
    </div>
  );
}

function Step2({ members, search, setSearch, selectedId, onSelect }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{t.whoHasIt}</h2>
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск по никнейму" showFilter={false} />
      <ul className="mt-3 divide-y divide-ink-100">
        {members.map((m) => (
          <li key={m.id}>
            <button onClick={() => onSelect(m.id)} className={"w-full flex items-center gap-3 py-3 px-2 text-left " + (selectedId === m.id ? "bg-brand-50 rounded-lg" : "")}>
              <span className="flex-1">{m.nickname}</span>
              {selectedId === m.id ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-500">
                  <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          </li>
        ))}
        {members.length === 0 ? <li className="text-center py-8 text-ink-500">Нет участников</li> : null}
      </ul>
    </div>
  );
}

function Step3({ coverFile, setCoverFile, coverUrl, setCoverUrl }) {
  const preview = coverFile ? URL.createObjectURL(coverFile) : coverUrl;
  return (
    <div>
      <h3 className="section-title mb-2">{t.bookPhoto}</h3>
      <label className="block bg-brand-50 rounded-2xl h-44 flex items-center justify-center cursor-pointer overflow-hidden">
        {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : (
          <span className="flex flex-col items-center text-brand-500">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
              <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] mt-2">{t.addPhoto}</span>
          </span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
      </label>
      <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder={t.orPasteUrl} className="input mt-3" />
    </div>
  );
}
