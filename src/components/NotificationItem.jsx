export default function NotificationItem({ notification, selectable = false, selected = false, onToggle }) {
  const date = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "";
  return (
    <div className="px-4 py-4 border-b border-ink-100 last:border-b-0 flex gap-3 items-start">
      {selectable ? (
        <button
          aria-label="Select"
          onClick={() => onToggle?.(notification.id)}
          className={
            "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition " +
            (selected ? "bg-brand-500 border-brand-500 text-white" : "border-ink-300")
          }
        >
          {selected ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-[15px] truncate">{notification.title}</h4>
          <span className="text-[11px] text-ink-500 shrink-0 mt-0.5">{date}</span>
        </div>
        <p className="text-[13px] text-ink-500 truncate">{notification.body}</p>
      </div>
      {!notification.read ? <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" /> : null}
    </div>
  );
}
