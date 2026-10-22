"use server";

import type { Result, SearchHit } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { searchOperation } from "@/server/operations";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { type SearchHitView, splitContent } from "./search-hit-view";

export type SearchActionInput = { query: string };

const SEARCHABLE = ["venue", "item", "customer"] as const;

const toView = ({ hit }: { hit: SearchHit }): SearchHitView | null => {
  const entityType = SEARCHABLE.find((type) => type === hit.entityType);
  if (!entityType) return null;
  const { title, snippet } = splitContent({ content: hit.content });
  return { entityType, entityId: hit.entityId, title, snippet, score: hit.score };
};

const toViews = ({ hits }: { hits: SearchHit[] }): Result<SearchHitView[]> => ({
  ok: true,
  value: hits.map((hit) => toView({ hit })).filter((view): view is SearchHitView => view !== null),
});

/** Semantic search over venues, items and customers (core `search` operation), hits shaped for the UI. */
export async function searchAction({
  query,
}: SearchActionInput): Promise<ActionResult<SearchHitView[]>> {
  const result = await runOperation({
    operation: searchOperation(),
    input: { query, entityTypes: [...SEARCHABLE], limit: 10 },
  });
  if (!result.ok) return toActionResult({ result });
  const hits = (result.value as { hits: SearchHit[] }).hits;
  return toActionResult({ result: toViews({ hits }) });
}

export type EnrichSearchHitsInput = { hits: SearchHit[] };

/** Titles and snippets for raw `search` hits (e.g. a tool result in the chat). */
export async function enrichSearchHitsAction({
  hits,
}: EnrichSearchHitsInput): Promise<ActionResult<SearchHitView[]>> {
  return toActionResult({ result: toViews({ hits: hits.slice(0, 20) }) });
}
