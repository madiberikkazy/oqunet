import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import { TERMS_SECTIONS, TERMS_UPDATED, TERMS_VERSION } from "../content/terms.js";
import { t } from "../utils/i18n.js";

/**
 * The terms, inside the app, with the two buttons that make them an agreement.
 *
 * ── Why not just open the web page ──────────────────────────────────────────
 *
 * Because a link is not consent. Sending somebody out to a browser and then
 * ticking a box on their behalf when they come back records nothing about what
 * they saw; worse, in the store builds the link leaves the app entirely, and a
 * reader on a train with no signal cannot register at all. Rendering the text
 * here means the agreement happens in one place, offline, and the app can
 * honestly record which wording was on screen — see `TERMS_VERSION`.
 *
 * ── The scroll gate ─────────────────────────────────────────────────────────
 *
 * "Agree" stays disabled until the text has been scrolled to the end. It is a
 * small friction and it is the point: a consent dialog whose accept button is
 * live before anything has been read is a dialog that documents nothing. The
 * hint under the button says why it is disabled, because a dead button with no
 * explanation reads as a broken screen.
 *
 * A short viewport is handled too — if the content fits without scrolling
 * there is nothing to scroll to, and the gate opens immediately.
 */
export default function TermsDialog({ open, onAgree, onDecline }) {
  const scrollRef = useRef(null);
  const [readToEnd, setReadToEnd] = useState(false);

  // Re-armed every time the dialog opens: somebody who declined and came back
  // should have to reach the end again, not inherit the last visit's answer.
  useEffect(() => {
    if (open) setReadToEnd(false);
  }, [open]);

  // The content may be shorter than the box on a tall screen, in which case no
  // scroll event will ever fire and the gate would never open. Measured after
  // paint, when the box has a height.
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 4) setReadToEnd(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function onScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    // A few pixels of slack: momentum scrolling on iOS rarely lands exactly on
    // the bottom, and a gate that needs a perfect landing is a gate nobody can
    // pass.
    if (scrollTop + clientHeight >= scrollHeight - 24) setReadToEnd(true);
  }

  return (
    <Modal open={open} onClose={onDecline} title={t.termsOfUse}>
      <p className="text-[12px] text-ink-300 -mt-2 mb-3">
        {t.termsVersionLabel(TERMS_VERSION, TERMS_UPDATED)}
      </p>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="overflow-y-auto pr-1 -mr-1 text-[14px] leading-relaxed"
        style={{ maxHeight: "48vh" }}
      >
        {TERMS_SECTIONS.map((section, i) => (
          <section key={section.heading ?? `intro-${i}`} className={i ? "mt-4" : ""}>
            {section.heading ? (
              <h4 className="font-semibold text-[14px] text-ink-900 mb-1">{section.heading}</h4>
            ) : null}
            {section.body.map((block, j) => <Block key={j} block={block} />)}
          </section>
        ))}
      </div>

      {/* Below the scroller, so it is visible before the reader starts and
          still visible when they finish. */}
      <p className="text-[12px] text-ink-300 mt-3 h-4">
        {readToEnd ? "" : t.termsScrollHint}
      </p>

      <div className="flex gap-2 mt-2">
        <button onClick={onDecline} className="btn-secondary flex-1">{t.termsDecline}</button>
        <button
          onClick={() => onAgree(TERMS_VERSION)}
          disabled={!readToEnd}
          className="btn-primary flex-1"
        >
          {t.termsAgree}
        </button>
      </div>
    </Modal>
  );
}

/** One block of the terms — see the shape note in src/content/terms.js. */
function Block({ block }) {
  if (block.p) {
    return <p className="text-ink-700 mb-2">{block.p}</p>;
  }
  if (block.list) {
    return (
      <ul className="list-disc pl-5 mb-2 space-y-1">
        {block.list.map((item, i) => <li key={i} className="text-ink-700">{item}</li>)}
      </ul>
    );
  }
  if (block.callout) {
    // The zero-tolerance clause. Boxed here exactly as it is boxed on the web
    // page: a reviewer looks for it, and a reader should not scroll past it.
    return (
      <div className="rounded-xl border border-ink-100 px-3.5 py-3 my-3">
        <strong className="block text-[14px] text-ink-900 mb-1">{block.callout}</strong>
        <span className="text-ink-700">{block.body}</span>
      </div>
    );
  }
  return null;
}
