import "server-only";
import { listBookingSeries } from "@okazi/core";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

/** Occurrence count per series id (one page). Empty on failure: markers then omit the total. */
export async function loadSeriesTotals(): Promise<Map<string, number>> {
  const result = await runOperation({ operation: listBookingSeries, input: { limit: LIMIT } });
  const items = result.ok ? result.value.items : [];
  return new Map(items.map(({ id, occurrences }) => [id, occurrences.length]));
}
