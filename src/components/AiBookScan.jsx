import { useEffect, useRef, useState } from "react";
import { scanBookCover } from "../utils/aiBooks.js";
import { t } from "../utils/i18n.js";

const PHASES = ["Reading the cover", "Finding the author", "Checking book details"];

/** A small, intentionally visible assistant for the add-book wizard. */
export default function AiBookScan({ onDetected, onFile }) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState(-1);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (phase < 0 || phase >= PHASES.length) return undefined;
    const timer = setTimeout(() => setPhase((current) => current + 1), 780);
    return () => clearTimeout(timer);
  }, [phase]);

  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setDone(false);
    setPhase(0);
    try {
      const detected = await scanBookCover(file);
      // Do not clobber a field with a low-confidence/unknown value. The form
      // remains the source of truth and every proposed field is editable.
      onDetected(detected.book || detected);
      onFile(file);
      setDone(true);
    } catch (err) {
      setError(err.code === "ai-not-configured" ? t.aiUnavailable : t.aiScanError);
    } finally {
      setPhase(-1);
    }
  }

  const scanning = phase >= 0;
  return (
    <section className="ai-scan-card mb-5" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="ai-orb shrink-0" aria-hidden="true"><span /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-brand-600">OquNet AI</p>
              <h3 className="text-[16px] font-bold text-ink-900">{t.aiScanTitle}</h3>
            </div>
            {done ? <span className="ai-done">✓ {t.aiReady}</span> : null}
          </div>
          <p className="mt-1 text-[13px] leading-5 text-ink-500">{t.aiScanHint}</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={choose} />

      {scanning ? (
        <div className="ai-scan-progress mt-4">
          <div className="ai-scan-beam" aria-hidden="true" />
          <div className="space-y-2 relative">
            {PHASES.map((label, index) => (
              <div key={label} className={"flex items-center gap-2 text-[13px] " + (index < phase ? "text-ok" : index === phase ? "text-brand-600 font-semibold" : "text-ink-300")}>
                <span className={index === phase ? "ai-working-dot" : "w-4 text-center"}>{index < phase ? "✓" : index === phase ? "" : "○"}</span>
                {label}{index === phase ? <span className="ai-typing"><i /><i /><i /></span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="ai-scan-action mt-4">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2l1.1-1.6h4.8L15.5 5h2A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7"/></svg>
          {done ? t.aiScanAgain : t.aiScanButton}
          <span>→</span>
        </button>
      )}
      {error ? <p className="mt-3 text-[12px] text-bad">{error}</p> : null}
    </section>
  );
}
