import { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const [toastNotification, setToastNotification] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Show toast for the latest unread notification
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length > 0) {
      const latest = unreadNotifs[0];
      if (latest !== toastNotification) {
        setToastNotification(latest);
        setShowToast(true);
        
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, toastNotification]);

  if (!showToast || !toastNotification) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="mx-4 mt-4 rounded-lg bg-surface border border-ink-200 shadow-lg p-4 pointer-events-auto animate-in slide-in-from-top fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[14px] text-ink-700 truncate">
              {toastNotification.title}
            </h3>
            {toastNotification.body && (
              <p className="text-[13px] text-ink-500 line-clamp-2 mt-0.5">
                {toastNotification.body}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="shrink-0 text-ink-400 hover:text-ink-500 transition"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
