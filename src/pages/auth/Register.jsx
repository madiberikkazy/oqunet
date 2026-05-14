import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import { registerWithEmail } from "../../firebase/auth.js";
import { uploadImage } from "../../firebase/storage.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { t } from "../../utils/i18n.js";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    email: "",
    nickname: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    notificationsEnabled: true,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function validate() {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Введите корректный email";
    if (!form.nickname.trim()) return "Введите никнейм";
    if (!form.firstName.trim() || !form.lastName.trim()) return "Введите имя и фамилию";
    if (form.password.length < 6) return "Пароль должен содержать минимум 6 символов";
    if (form.password !== form.confirmPassword) return "Пароли не совпадают";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError("");
    setSubmitting(true);
    try {
      let photoURL = "";
      if (photoFile) {
        // Upload after we know the uid — but storage.uploadImage can use a path now
        photoURL = await uploadImage(photoFile, `avatars/${form.email}_${Date.now()}`);
      }
      const profile = await registerWithEmail({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        firstName: form.firstName,
        lastName: form.lastName,
        notificationsEnabled: form.notificationsEnabled,
        photoURL,
      });
      setUser(profile);
      navigate("/", { replace: true });
    } catch (err) {
      setError(prettyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileShell withNav={false}>
      <div className="px-6 pt-6 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v.5H4v-.5Zm0 3.5h16v1H4v-1Zm0 3h16V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{t.signUp}</h1>
        <p className="text-[13px] text-ink-500">Создайте аккаунт OquNet</p>
      </div>

      <form onSubmit={onSubmit} className="px-6 pt-5 space-y-3">
        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.email}</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="input"
          />
        </label>

        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.nickname}</span>
          <input
            value={form.nickname}
            onChange={(e) => update("nickname", e.target.value.replace(/\s/g, ""))}
            placeholder="myhandle"
            autoComplete="username"
            className="input"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[13px] text-ink-500 mb-1 block">{t.firstName}</span>
            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="text-[13px] text-ink-500 mb-1 block">{t.lastName}</span>
            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="input" />
          </label>
        </div>

        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.password}</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            autoComplete="new-password"
            className="input"
          />
        </label>

        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.confirmPassword}</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            autoComplete="new-password"
            className="input"
          />
        </label>

        <label className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            checked={form.notificationsEnabled}
            onChange={(e) => update("notificationsEnabled", e.target.checked)}
            className="w-5 h-5 accent-brand-500"
          />
          <span className="text-[14px]">{t.enableNotifications}</span>
        </label>

        <label className="block pt-1">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.uploadPhoto}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="block text-[13px] text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-ink-700"
          />
        </label>

        {error ? <p className="text-bad text-[13px]">{error}</p> : null}

        <button type="submit" disabled={submitting} className="btn-primary mt-2">
          {submitting ? "..." : t.signUp}
        </button>

        <p className="text-center text-[14px] text-ink-500 pt-2">
          Уже есть аккаунт?{" "}
          <Link to="/auth/login" className="text-brand-500 font-medium">{t.signIn}</Link>
        </p>
      </form>
    </MobileShell>
  );
}

function prettyError(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") return "Этот email уже зарегистрирован";
  if (code === "auth/invalid-email") return "Некорректный email";
  if (code === "auth/weak-password") return "Слишком простой пароль (минимум 6 символов)";
  if (code === "auth/operation-not-allowed")
    return "Email/Password sign-in выключен в Firebase. Откройте Firebase Console → Authentication → Sign-in method и включите его.";
  return err?.message || "Ошибка регистрации";
}
