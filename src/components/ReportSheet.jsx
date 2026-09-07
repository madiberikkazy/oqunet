import { useState } from "react";
import Modal from "./Modal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { createReport, REPORT_NOTE_MAX } from "../firebase/firestore.js";
import { t } from "../utils/i18n.js";
import { logger } from "../utils/logger.js";

/**
 * "Пожаловаться" — the dialog, for every kind of thing that can be reported.
 *
 * One component rather than one per surface, because a report is the same act
 * wherever it starts: a reason from a short closed list, optionally a sentence
 * in the reporter's own words, and a written record. Only `targetType` and the
 * ids differ, and those are props.
 *
 * ── Why it ends on a confirmation rather than closing ───────────────────────
 *
 * Filing a report changes nothing the reporter can see — the post is still
 * there, the person is still there — so a dialog that simply vanished would be
 * indistinguishable from one that failed. The second step says the report was
 * received and, just as importantly, says what it does *not* do: the author is
 * not told. People hesitate to report when they fear the other person will
 * find out, and the answer to that has to be on the screen where they hesitate.
 *
 * Blocking is the other half and lives elsewhere: reporting tells us, blocking
 * changes what the reader sees. Somebody dealing with harassment should not
 * have to wait on a moderator for it to stop.
 */

const REASONS = [
  ["spam", () => t.reportReasonSpam],
  ["abuse", () => t.reportReasonAbuse],
  ["sexual", () => t.reportReasonSexual],
  ["violence", () => t.reportReasonViolence],
  ["other", () => t.reportReasonOther],
];

export default function ReportSheet({
  open, onClose,
  /** "post" | "comment" | "message" | "user" */
  targetType,
  targetId,
  /** Who wrote the thing. Copied into the report so a deleted post is still traceable. */
  targetAuthorId = null,
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function close() {
    onClose?.();
    // Reset after the dialog is gone, so the form does not visibly empty
    // itself on the way out.
    setTimeout(() => {
      setReason(""); setNote(""); setError(""); setSent(false);
    }, 200);
  }

  async function submit() {
    if (!reason || busy || !user?.id) return;
    setBusy(true);
    setError("");
    try {
      await createReport({
        reporterId: user.id,
        targetType,
        targetId,
        targetAuthorId,
        reason,
        note,
      });
      setSent(true);
    } catch (err) {
      logger.error("report.create", err?.message, { targetType, targetId, code: err?.code });
      setError(err?.errorKey && t[err.errorKey] ? t[err.errorKey] : t.reportFailed);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Modal open={open} onClose={close} title={t.reportSent}>
        <p className="text-[14px] text-ink-500 leading-relaxed">{t.reportSentHint}</p>
        <button onClick={close} className="btn-primary mt-5">{t.ok}</button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title={t.reportTitle} scrollable>
      <p className="text-[13px] text-ink-500 leading-relaxed mb-4">{t.reportHint}</p>

      {/* Radios rather than a select: five options, and on a phone a native
          picker for five items is two taps and a wheel where a list is one. */}
      <div className="space-y-1">
        {REASONS.map(([value, label]) => (
          <label
            key={value}
            className={
              "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition " +
              (reason === value ? "bg-brand-50" : "hover:bg-ink-100/60")
            }
          >
            <input
              type="radio"
              name="report-reason"
              value={value}
              checked={reason === value}
              onChange={() => setReason(value)}
              className="w-4 h-4 accent-brand-500 shrink-0"
            />
            <span className="text-[15px] text-ink-900">{label()}</span>
          </label>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, REPORT_NOTE_MAX))}
        placeholder={t.reportNotePlaceholder}
        rows={3}
        className="input mt-4 resize-none text-[14px]"
      />

      {error ? <p className="text-bad text-[13px] mt-3">{error}</p> : null}

      <div className="flex gap-2 mt-5">
        <button onClick={close} className="btn-secondary flex-1">{t.cancel}</button>
        <button
          onClick={submit}
          disabled={!reason || busy}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {busy ? "…" : t.reportSubmit}
        </button>
      </div>
    </Modal>
  );
}
