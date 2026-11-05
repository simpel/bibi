import { countOpenInboundMessages, countUnreadNotifications } from "@bibi/core";
import type { ShellCounts } from "@/components/shell/shell-types";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/**
 * The shell's first render of its live counts (ADR 0094): unread notifications, and open inbox
 * messages when the member may read the inbox (no read without `inbox:read`). A failed read shows
 * no count rather than breaking the shell.
 */
export async function loadLiveCounts(): Promise<ShellCounts> {
  const abilities = await getCallerAbilities();
  const [unread, inbox] = await Promise.all([
    runOperation({ operation: countUnreadNotifications, input: {} }),
    can({ abilities, permission: "inbox:read" })
      ? runOperation({ operation: countOpenInboundMessages, input: {} })
      : null,
  ]);
  return {
    unread: unread.ok ? unread.value.unread : 0,
    inboxOpen: inbox?.ok ? inbox.value.open : null,
  };
}
