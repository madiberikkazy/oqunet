import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext.jsx";
import { blockUser, unblockUser, listBlockedIds } from "../firebase/firestore.js";
import { qk } from "../lib/queryKeys.js";
import { logger } from "./logger.js";

/**
 * Who this reader has blocked, and the two verbs that change it.
 *
 * ── Why one hook and not a filter at each call site ─────────────────────────
 *
 * Blocking is only meaningful if it holds *everywhere* — a person you blocked
 * turning up in a comment thread because that screen forgot to filter is worse
 * than no blocking at all, because the reader believed they were done with
 * them. So the list is fetched once, cached for the session, and every screen
 * that renders somebody else's words asks the same `isBlocked`.
 *
 * A Set rather than an array: every consumer wants membership, and a feed of
 * sixty posts filtered against an array is sixty scans.
 *
 * ── What blocking does not do ──────────────────────────────────────────────
 *
 * It is one-directional and silent. The blocked person's own screens are
 * unchanged and they are never told, because being told is the confrontation
 * that blocking exists to avoid. The one thing enforced server-side is
 * messaging: the rules refuse a message to somebody who blocked the sender,
 * because a message that is stored but hidden still moves an unread counter
 * and still fires a notification.
 */
export function useBlocked() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data } = useQuery({
    queryKey: qk.blocked.ids(userId),
    enabled: Boolean(userId),
    // Blocks change rarely and only by this reader's own hand, so there is
    // nothing to poll for. The two mutations below invalidate it directly.
    staleTime: 10 * 60_000,
    queryFn: () => listBlockedIds(userId),
  });

  const blockedIds = useMemo(() => new Set(data ?? []), [data]);

  const isBlocked = useCallback((id) => Boolean(id) && blockedIds.has(id), [blockedIds]);

  /** Drop every list that renders other people's content. */
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.blocked.all });
  }, [queryClient]);

  const block = useCallback(async (blockedId) => {
    if (!userId || !blockedId) return false;
    try {
      await blockUser({ blockerId: userId, blockedId });
      invalidate();
      return true;
    } catch (err) {
      logger.error("block.create", err?.message, { blockedId, code: err?.code });
      return false;
    }
  }, [userId, invalidate]);

  const unblock = useCallback(async (blockedId) => {
    if (!userId || !blockedId) return false;
    try {
      await unblockUser({ blockerId: userId, blockedId });
      invalidate();
      return true;
    } catch (err) {
      logger.error("block.remove", err?.message, { blockedId, code: err?.code });
      return false;
    }
  }, [userId, invalidate]);

  return { blockedIds, isBlocked, block, unblock };
}
