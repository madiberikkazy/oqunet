import { useEffect } from "react";

export default function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-soft overflow-hidden">
        {title ? <header className="px-5 pt-5 pb-2"><h3 className="font-semibold text-[17px]">{title}</h3></header> : null}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
