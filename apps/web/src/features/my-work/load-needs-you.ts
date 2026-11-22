import { type MyWorkTask, viewMyTasks } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

/**
 * Needs you for the shell (spec: home): read once per request, for the notification panel, the
 * My work badge and the order page's own tasks. Null without `order:read`; a failed read shows
 * nothing rather than breaking the shell.
 */
export const loadNeedsYou = cache(async (): Promise<MyWorkTask[] | null> => {
  const result = await runOperation({ operation: viewMyTasks, input: {} }).catch(() => null);
  return result?.ok ? result.value.tasks : null;
});
