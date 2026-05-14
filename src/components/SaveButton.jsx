export default function SaveButton({ saved, onClick, size = 22 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Unsave" : "Save"}
      className={
        "w-8 h-8 rounded-lg inline-flex items-center justify-center transition " +
        (saved ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:bg-ink-100")
      }
    >
      <svg width={size - 4} height={size - 4} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
        <path
          d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5v16.25a.5.5 0 0 1-.8.4L12 17l-5.2 4.15a.5.5 0 0 1-.8-.4V4.5Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
