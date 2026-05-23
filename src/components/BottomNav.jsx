import { NavLink } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import { t } from "../utils/i18n.js";

export default function BottomNav() {
  useLang(); // subscribe to language changes so labels re-render
  const { unreadCount } = useNotifications();

  const items = [
    {
      to: "/",
      label: t.navHome,
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-6h-7v6H5A1.5 1.5 0 0 1 3.5 19v-8.5Z"
            stroke="currentColor" strokeWidth="1.6"
            fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.08 : 0}
          />
        </svg>
      ),
    },
    {
      to: "/books",
      label: t.navBooks,
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v.5H4v-.5Zm0 3.5h16v1H4v-1Zm0 3h16V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5Z" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      to: "/notifications",
      label: t.navNotification,
      icon: () => (
        <div className="relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3a6 6 0 0 0-6 6v3.5L4.5 15a.75.75 0 0 0 .53 1.28h13.94A.75.75 0 0 0 19.5 15L18 12.5V9a6 6 0 0 0-6-6Zm0 18a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      ),
    },
    {
      to: "/profile",
      label: t.navProfile,
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 20c.6-3.4 3.5-6 7-6s6.4 2.6 7 6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-ink-100/60">
      <ul className="grid grid-cols-4 py-2 w-full mx-auto sm:max-w-xl lg:max-w-2xl" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                "flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-150 " +
                (isActive ? "text-brand-500" : "text-ink-500")
              }
            >
              {({ isActive }) => (
                <>
                  {it.icon(isActive)}
                  <span>{it.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
