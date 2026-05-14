import { Link } from "react-router-dom";

export default function Fab({ to, onClick, ariaLabel = "Add" }) {
  const inner = (
    <span className="bg-brand-500 hover:bg-brand-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-soft transition active:scale-95">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
  return (
    <div className="absolute right-4 bottom-24 z-10">
      {to ? <Link to={to} aria-label={ariaLabel}>{inner}</Link> : <button onClick={onClick} aria-label={ariaLabel}>{inner}</button>}
    </div>
  );
}
