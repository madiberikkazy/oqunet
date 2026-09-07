import { useState } from "react";
import KebabMenu from "./KebabMenu.jsx";
import Modal from "./Modal.jsx";
import ReportSheet from "./ReportSheet.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useBlocked } from "../utils/useBlocked.js";
import { t } from "../utils/i18n.js";

/**
 * The "⋮" that carries reporting and blocking, wherever somebody else's words
 * are shown.
 *
 * ── Why this is one component ──────────────────────────────────────────────
 *
 * Because the guarantee is "you can always report this", and a guarantee that
 * each screen has to remember to implement is one that some screen will not.
 * A post in the feed, the same post on its own page, a comment, a profile —
 * four surfaces, one control, and adding a fifth surface means rendering this
 * rather than reasoning about it again.
 *
 * It owns its own dialogs. The alternative — hoisting `open` state into every
 * screen that shows a post — is four copies of the same three lines, and the
 * feed would need one per row.
 *
 * ── Blocking is only offered where it makes sense ──────────────────────────
 *
 * `authorId` is optional: a comment can be reported without offering to block
 * its author from inside the thread, and a reader can never report or block
 * themselves — those items are simply absent rather than shown disabled, since
 * a greyed-out "block yourself" is a joke at the reader's expense.
 */
export default function ModerationMenu({
  /** "post" | "comment" | "message" | "user" */
  targetType,
  targetId,
  /** Who wrote it. Omit to hide the block item. */
  authorId = null,
  /** Shown in the block confirmation, so it names a person rather than an id. */
  authorName = "",
  /** Extra items to show above the moderation ones — edit, delete, share. */
  items = [],
  triggerClassName,
  ariaLabel,
}) {
  const { user } = useAuth();
  const { isBlocked, block, unblock } = useBlocked();
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const mine = Boolean(user?.id) && authorId === user.id;
  const canModerate = Boolean(user?.id) && !mine;
  const blocked = Boolean(authorId) && isBlocked(authorId);

  const reportLabel = {
    post: () => t.reportPost,
    comment: () => t.reportComment,
    message: () => t.report,
    user: () => t.reportUser,
  }[targetType]?.() ?? t.report;

  const menuItems = [
    ...items,
    ...(canModerate ? [{ label: reportLabel, onClick: () => setReporting(true) }] : []),
    ...(canModerate && authorId
      ? [blocked
          ? { label: t.unblock, onClick: () => unblock(authorId) }
          : { label: t.block, onClick: () => setConfirmBlock(true), danger: true }]
      : []),
  ];

  // Nothing to offer — on your own post with no extra items, the "⋮" would
  // open an empty sheet. Draw nothing instead.
  if (!menuItems.length) return null;

  async function doBlock() {
    setBusy(true);
    await block(authorId);
    setBusy(false);
    setConfirmBlock(false);
  }

  return (
    <>
      <KebabMenu items={menuItems} triggerClassName={triggerClassName} ariaLabel={ariaLabel} />

      <ReportSheet
        open={reporting}
        onClose={() => setReporting(false)}
        targetType={targetType}
        targetId={targetId}
        targetAuthorId={authorId}
      />

      {/* Blocking is instant and needs no moderator, so the only thing between
          the tap and the effect is this — and it exists because the effect is
          invisible from the blocker's side until they wonder where somebody
          went. The body says what actually changes, including the part people
          most want to know: the other person is not told. */}
      <Modal open={confirmBlock} onClose={() => setConfirmBlock(false)} title={t.blockConfirmTitle}>
        <p className="text-[14px] text-ink-500 leading-relaxed">
          {t.blockConfirmBody(authorName || t.deletedUser)}
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setConfirmBlock(false)} className="btn-secondary flex-1">
            {t.cancel}
          </button>
          <button onClick={doBlock} disabled={busy} className="btn-danger flex-1 disabled:opacity-50">
            {busy ? "…" : t.block}
          </button>
        </div>
      </Modal>
    </>
  );
}
