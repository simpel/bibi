import "server-only";
import { getRunSheet, ok, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";
import { loadRunSheetViews, type RunSheetViewData } from "./load-run-sheet-views";

const loadRunSheetDocumentCached = cache(async (id: string): Promise<Result<RunSheetViewData>> => {
  const found = await runOperation({ operation: getRunSheet, input: { id } });
  if (!found.ok) return found;
  const views = await loadRunSheetViews({ runSheets: [found.value] });
  if (!views.ok) return views;
  const [view] = views.value;
  return ok({ value: view ?? { runSheet: found.value, name: null, fields: [], versions: [] } });
});

/** One run sheet version with what its page shows (`loadRunSheetViews`), read once per request. */
export function loadRunSheetDocument({ id }: { id: string }): Promise<Result<RunSheetViewData>> {
  return loadRunSheetDocumentCached(id);
}
