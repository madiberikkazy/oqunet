import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import Stepper from "../../components/Stepper.jsx";
import { createCommunity, updateUser } from "../../firebase/firestore.js";
import { uploadImage } from "../../firebase/storage.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { t } from "../../utils/i18n.js";

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { setCommunity } = useCommunity();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nickname: "", name: "", notificationsEnabled: true, photoURL: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function next() {
    setError("");
    if (step === 1) {
      if (!form.nickname.trim() || !form.name.trim()) { setError("Заполните оба поля"); return; }
    }
    if (step < 3) { setStep(step + 1); return; }
    submit();
  }

  async function submit() {
    setSubmitting(true);
    try {
      let photoURL = form.photoURL;
      if (photoFile) photoURL = await uploadImage(photoFile, `communities/${form.nickname}`);
      const c = await createCommunity({
        ...form, photoURL, ownerId: user.id, memberIds: [user.id], createdAt: Date.now(),
      });
      await updateUser(user.id, { communityId: c.id, role: "admin" });
      setCommunity(c);
      refresh();
      navigate("/", { replace: true });
    } catch (err) { setError(err?.message || "Ошибка создания"); }
    finally { setSubmitting(false); }
  }

  return (
    <MobileShell withNav={false}>
      <div className="flex items-center gap-2 px-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="flex-1"><Stepper step={step} total={3} title="Новое сообщество" /></div>
      </div>

      <div className="px-5 pt-3 pb-24 space-y-3">
        {step === 1 ? (
          <>
            <h2 className="text-xl font-bold mb-2">Шаг 1 — Основное</h2>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value.replace(/\s/g, "").toLowerCase() })}
              placeholder={t.communityNickname + " (aiu.oqyrman)"} className="input"
            />
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.communityName} className="input"
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-xl font-bold mb-2">Шаг 2 — Уведомления</h2>
            <label className="card p-4 flex items-center gap-3">
              <input type="checkbox" checked={form.notificationsEnabled}
                onChange={(e) => setForm({ ...form, notificationsEnabled: e.target.checked })}
                className="w-5 h-5 accent-brand-500" />
              <span className="text-[14px]">Включить системные уведомления для участников</span>
            </label>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-xl font-bold mb-2">Шаг 3 — {t.communityPhoto}</h2>
            <label className="block bg-brand-50 rounded-2xl h-40 flex items-center justify-center cursor-pointer overflow-hidden">
              {photoFile ? (
                <img src={URL.createObjectURL(photoFile)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand-500 flex flex-col items-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="11" opacity="0.15" />
                    <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[13px] mt-2">{t.addPhoto}</span>
                </span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </label>
            <input value={form.photoURL} onChange={(e) => setForm({ ...form, photoURL: e.target.value })} placeholder={t.orPasteUrl} className="input" />
          </>
        ) : null}

        {error ? <p className="text-bad text-[13px]">{error}</p> : null}
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-5">
        <button onClick={next} disabled={submitting} className="btn-primary">
          {submitting ? "..." : step === 3 ? "Создать" : t.next}
        </button>
      </div>
    </MobileShell>
  );
}
