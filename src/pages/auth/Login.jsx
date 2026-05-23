import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import { signInWithIdentifier, signInWithGoogle } from "../../firebase/auth.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { t } from "../../utils/i18n.js";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function onGoogle() {
    setError("");
    setGoogleBusy(true);
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Google кіру қатесі");
    } finally {
      setGoogleBusy(false);
    }
  }

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

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-ink-200" />
          <span className="text-[12px] text-ink-400">немесе</span>
          <div className="flex-1 h-px bg-ink-200" />
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          disabled={googleBusy}
          onClick={onGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-ink-200 bg-surface text-ink-700 font-medium text-[14px] active:scale-[0.98] transition disabled:opacity-60"
        >
          <GoogleIcon />
          {googleBusy ? "..." : "Google арқылы кіру"}
        </button>

        <p className="text-center text-[14px] text-ink-500 pt-2">
          Нет аккаунта?{" "}
          <Link to="/auth/register" className="text-brand-500 font-medium">{t.signUp}</Link>
        </p>
      </form>
    </MobileShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
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
