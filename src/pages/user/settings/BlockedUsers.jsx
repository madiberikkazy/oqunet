import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import SettingsPage from "../../../components/SettingsPage.jsx";
import Avatar from "../../../components/Avatar.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import { SkeletonList, PersonRowSkeleton } from "../../../components/Skeleton.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useBlocked } from "../../../utils/useBlocked.js";
import { getUserById } from "../../../firebase/firestore.js";
import { qk } from "../../../lib/queryKeys.js";
import { t } from "../../../utils/i18n.js";

/**
 * Заблокированные — the list, and the only place a block can be undone.
 *
 * It exists because a block with no way back is a trap: people block in anger,
 * block the wrong account, or simply change their minds, and an app that
 * offers no undo turns a two-second decision into a permanent one. App Store
 * guideline 1.2 asks for the ability to block; a reader asks for the ability
 * to have been wrong about it.
 *
 * Names are fetched here rather than stored on the block document. A block
 * holds two ids and nothing else — copying a name into it would be a second
 * copy of the profile to go stale, and this list is opened rarely enough that
 * a handful of point reads costs nothing.
 */
export default function BlockedUsers() {
  const { user } = useAuth();
  const { blockedIds, unblock } = useBlocked();
  const ids = [...blockedIds];

  const { data: people, isLoading } = useQuery({
    // Keyed on the ids themselves, so unblocking somebody re-fetches the
    // shorter list rather than serving the old one from cache.
    queryKey: [...qk.blocked.people(user?.id), ids.join(",")],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const rows = await Promise.all(ids.map((id) => getUserById(id).catch(() => null)));
      return rows.map((row, i) => row ?? { id: ids[i], nickname: "", firstName: "", lastName: "" });
    },
  });

  if (isLoading && ids.length) {
    return (
      <SettingsPage title={t.blockedUsers}>
        <SkeletonList count={3} label={t.loading} Item={PersonRowSkeleton} />
      </SettingsPage>
    );
  }

  if (!ids.length) {
    return (
      <SettingsPage title={t.blockedUsers}>
        <EmptyState title={t.blockedEmpty} subtitle={t.blockedEmptyHint} />
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title={t.blockedUsers}>
      <ul className="px-5 divide-y divide-ink-100">
        {(people ?? []).map((person) => {
          const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim()
            || `@${person.nickname ?? ""}`;
          return (
            <li key={person.id} className="flex items-center gap-3 py-3">
              {/* Still a link to their profile. Blocking is not erasure — a
                  reader may well want to check who this was before undoing it. */}
              <Link to={`/users/${person.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar src={person.photoURL} name={name} size={40} />
                <span className="min-w-0">
                  <span className="block text-[15px] text-ink-900 truncate">{name || t.deletedUser}</span>
                  {person.nickname ? (
                    <span className="block text-[13px] text-ink-300 truncate">@{person.nickname}</span>
                  ) : null}
                </span>
              </Link>
              <button
                onClick={() => unblock(person.id)}
                className="shrink-0 text-[13px] font-medium text-brand-500 px-3 py-1.5 rounded-lg bg-brand-500/10 active:scale-95 transition"
              >
                {t.unblock}
              </button>
            </li>
          );
        })}
      </ul>
    </SettingsPage>
  );
}
