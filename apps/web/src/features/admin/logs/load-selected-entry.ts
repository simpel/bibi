import "server-only";
import type { SystemLogEntry } from "@bibi/core";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";

export type LoadSelectedEntryInput = { selected: string | null; items: SystemLogEntry[] };

/** `?log=` entry: from the current page, else fetched on its own (shared link, other page). */
export async function loadSelectedEntry({
  selected,
  items,
}: LoadSelectedEntryInput): Promise<SystemLogEntry | null> {
  if (!selected) return null;
  const onPage = items.find((item) => item.id === selected);
  if (onPage) return onPage;
  const result = await runPlatformOperation({
    operation: platformOperations().getSystemLog,
    input: { id: selected },
  });
  return result.ok ? result.value : null;
}
