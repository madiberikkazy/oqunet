import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import { signInWithIdentifier } from "../../firebase/auth.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { t } from "../../utils/i18n.js";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const profile = await signInWithIdentifier(form);
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
      <div className="px-6 pt-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v.5H4v-.5Zm0 3.5h16v1H4v-1Zm0 3h16V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">С возвращением</h1>
        <p className="text-[13px] text-ink-500">Войдите в свой аккаунт OquNet</p>
      </div>

      <form onSubmit={onSubmit} className="px-6 pt-6 space-y-3">
        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.identifier}</span>
          <input
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value.trim() }))}
            placeholder="email или nickname"
            autoComplete="username"
            className="input"
          />
        </label>

        <label className="block">
          <span className="text-[13px] text-ink-500 mb-1 block">{t.password}</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoComplete="current-password"
            className="input"
          />
        </label>

        {error ? <p className="text-bad text-[13px]">{error}</p> : null}

        <button type="submit" disabled={submitting} className="btn-primary mt-1">
          {submitting ? "..." : t.signIn}
        </button>

        <p className="text-center text-[14px] text-ink-500 pt-2">
          Нет аккаунта?{" "}
          <Link to="/auth/register" className="text-brand-500 font-medium">{t.signUp}</Link>
        </p>
      </form>
    </MobileShell>
  );
}

function prettyError(err) {
  const code = err?.code || "";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "Неверный пароль";
  if (code === "auth/user-not-found") return "Пользователь не найден";
  if (code === "auth/too-many-requests") return "Слишком много попыток. Попробуйте позже.";
  if (code === "auth/operation-not-allowed")
    return "Email/Password sign-in выключен в Firebase. Откройте Firebase Console → Authentication → Sign-in method и включите его.";
  return err?.message || "Ошибка входа";
}
