import { type MyWorkTask, viewMyTasks } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

/**
 * Needs you for the shell (spec: home): read once per page load, for the notification panel and
 * the My work badge. Null without `order:read`; a failed read shows nothing rather than breaking
 * the shell.
 */
export async function loadNeedsYou(): Promise<MyWorkTask[] | null> {
  const result = await runOperation({ operation: viewMyTasks, input: {} }).catch(() => null);
  return result?.ok ? result.value.tasks : null;
}
