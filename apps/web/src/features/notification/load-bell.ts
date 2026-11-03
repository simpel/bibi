import { countUnreadNotifications, listNotifications } from "@bibi/core";
import type { NotificationBellData } from "@/components/shell/shell-types";
import { runOperation } from "@/server/run-operation";

/** How many of the latest notifications the bell's popover shows. */
const LATEST = 8;

/**
 * The bell's first render (ADR 0094): the unread count and the latest notifications. A failed
 * read shows an empty bell rather than breaking the shell.
 */
export async function loadBell(): Promise<NotificationBellData> {
  const [list, count] = await Promise.all([
    runOperation({ operation: listNotifications, input: { limit: LATEST } }),
    runOperation({ operation: countUnreadNotifications, input: {} }),
  ]);
  return {
    latest: list.ok ? list.value.items : [],
    unread: count.ok ? count.value.unread : 0,
  };
}
