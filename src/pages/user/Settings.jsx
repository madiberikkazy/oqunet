import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCommunity } from "../../contexts/CommunityContext.jsx";
import { getActiveBorrowingForUser } from "../../firebase/firestore.js";
import { t } from "../../utils/i18n.js";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, switchRole, updateProfile } = useAuth();
  const { community } = useCommunity();

  async function trySwitchRole() {
    if (user.role === "admin") {
      // Admin → user: check no active borrowing first
      const active = await getActiveBorrowingForUser(user.id);
      if (active) {
        alert("Сначала верните взятую книгу.");
        return;
      }
      await switchRole();
      navigate("/", { replace: true });
    } else {
      // User → admin: always requires creating a brand-new community.
      // They cannot become admin of the community they already belong to as a member.
      navigate("/community/create");
    }
  }

  return (
    <MobileShell withNav={false}>
      <SearchBar value="" onChange={() => {}} onBack={() => navigate(-1)} showFilter={false} />

      <div className="px-5 pt-5">
        <h1 className="text-xl font-bold mb-4">Настройки</h1>

        <Row label="Тема" value="Светлая (по умолчанию)" />
        <Row label="Язык" value="Русский" />
        <Row label="Email" value={user.email || "—"} />
        <Row
          label="Уведомления"
          right={
            <input
              type="checkbox"
              checked={Boolean(user.notificationsEnabled)}
              onChange={(e) => updateProfile({ notificationsEnabled: e.target.checked })}
              className="w-5 h-5 accent-brand-500"
            />
          }
        />

        <h3 className="section-title mt-6 mb-2">Роль</h3>
        <button onClick={trySwitchRole} className="btn-secondary">
          {user.role === "admin" ? t.switchToUser : t.switchToAdmin}
        </button>
        <p className="text-[12px] text-ink-500 mt-2">
          {user.role === "admin"
            ? "Переключение в режим пользователя не удалит ваше сообщество."
            : "Чтобы стать администратором, вам нужно создать новое сообщество."}
        </p>

        <h3 className="section-title mt-6 mb-2">Аккаунт</h3>
        <button
          onClick={async () => {
            await signOut();
            navigate("/auth/login", { replace: true });
          }}
          className="w-full text-left rounded-xl bg-badSoft text-bad font-semibold py-3 px-4"
        >
          {t.logOut}
        </button>
      </div>
    </MobileShell>
  );
}

function Row({ label, value, right }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-100">
      <span className="text-[14px] text-ink-700">{label}</span>
      {right || <span className="text-[14px] text-ink-500">{value}</span>}
    </div>
  );
}