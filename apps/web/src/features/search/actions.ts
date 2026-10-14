"use server";

import { getRoom, type Result, type SearchHit } from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { searchOperation } from "@/server/operations";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { type SearchHitView, splitContent } from "./search-hit-view";

export type SearchActionInput = { query: string };

const toView = async ({ hit }: { hit: SearchHit }): Promise<SearchHitView | null> => {
  const { title, snippet } = splitContent({ content: hit.content });
  const base = { entityId: hit.entityId, title, snippet, score: hit.score };
  if (hit.entityType === "venue") {
    return { ...base, entityType: "venue", venueId: hit.entityId };
  }
  if (hit.entityType !== "room") return null;
  const room = await runOperation({ operation: getRoom, input: { id: hit.entityId } });
  return room.ok ? { ...base, entityType: "room", venueId: room.value.venueId } : null;
};

/** Semantic search over venues and rooms (core `search` operation), hits enriched for the UI. */
export async function searchAction({
  query,
}: SearchActionInput): Promise<ActionResult<SearchHitView[]>> {
  const result = await runOperation({
    operation: searchOperation(),
    input: { query, entityTypes: ["venue", "room"], limit: 10 },
  });
  if (!result.ok) return toActionResult({ result });
  const hits = (result.value as { hits: SearchHit[] }).hits;
  const views = (await Promise.all(hits.map((hit) => toView({ hit })))).filter(
    (view): view is SearchHitView => view !== null,
  );
  const mapped: Result<SearchHitView[]> = { ok: true, value: views };
  return toActionResult({ result: mapped });
}

export type EnrichSearchHitsInput = { hits: SearchHit[] };

/** Adds titles and the venue to open to raw `search` hits (e.g. a tool result in the chat). */
export async function enrichSearchHitsAction({
  hits,
}: EnrichSearchHitsInput): Promise<ActionResult<SearchHitView[]>> {
  const views = (await Promise.all(hits.slice(0, 20).map((hit) => toView({ hit })))).filter(
    (view): view is SearchHitView => view !== null,
  );
  const mapped: Result<SearchHitView[]> = { ok: true, value: views };
  return toActionResult({ result: mapped });
}
