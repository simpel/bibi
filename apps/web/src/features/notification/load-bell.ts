import { countUnreadNotifications } from "@bibi/core";
import type { NotificationBellData } from "@/components/shell/shell-types";
import { runOperation } from "@/server/run-operation";

/**
 * The bell's first render (ADR 0094): only the unread count; the popover reads its rows when it
 * opens. A failed read shows an empty bell rather than breaking the shell.
 */
export async function loadBell(): Promise<NotificationBellData> {
  const count = await runOperation({ operation: countUnreadNotifications, input: {} });
  return { unread: count.ok ? count.value.unread : 0 };
}
