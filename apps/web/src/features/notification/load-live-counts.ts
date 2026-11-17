import { countOpenInboundMessages, countUnreadNotifications, viewMyTasks } from "@bibi/core";
import type { ShellCounts } from "@/components/shell/shell-types";
import { countDue } from "@/features/my-work/lib/count-due";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/**
 * The shell's first render of its live counts (ADR 0094): unread notifications, and open inbox
 * messages when the member may read the inbox (no read without `inbox:read`), and the Needs you
 * tasks due now for My work. A failed read shows no count rather than breaking the shell.
 */
export async function loadLiveCounts(): Promise<ShellCounts> {
  const abilities = await getCallerAbilities();
  const [unread, inbox, tasks] = await Promise.all([
    runOperation({ operation: countUnreadNotifications, input: {} }),
    can({ abilities, permission: "inbox:read" })
      ? runOperation({ operation: countOpenInboundMessages, input: {} })
      : null,
    runOperation({ operation: viewMyTasks, input: {} }),
  ]);
  return {
    unread: unread.ok ? unread.value.unread : 0,
    inboxOpen: inbox?.ok ? inbox.value.open : null,
    myWorkDue: tasks.ok ? countDue({ tasks: tasks.value.tasks }) : null,
  };
}
