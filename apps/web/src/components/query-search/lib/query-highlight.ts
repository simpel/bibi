import { ORDER_QUERY_TOKEN } from "@bibi/core/schemas";
import { type QueryVocabulary, qualifierOf } from "./query-vocabulary";

/** A stretch of the search: plain text, a known qualifier (`-status:`) or its value (`Lead`). */
export type QueryPart = { text: string; kind: "plain" | "key" | "value" };

export type QueryPartsInput = { text: string; vocabulary: QueryVocabulary };

/**
 * The search cut into parts for highlighting, GitHub style: known qualifiers and their values;
 * everything else, unknown words included, stays plain. The parts join back to `text`.
 */
export function queryParts({ text, vocabulary }: QueryPartsInput): QueryPart[] {
  const parts: QueryPart[] = [];
  let at = 0;
  for (const match of text.matchAll(ORDER_QUERY_TOKEN)) {
    const [whole, minus = "", word, value = ""] = match;
    if (!word || !qualifierOf({ word, vocabulary })) continue;
    const start = match.index ?? 0;
    if (start > at) parts.push({ text: text.slice(at, start), kind: "plain" });
    parts.push({ text: `${minus}${word}:`, kind: "key" });
    parts.push({ text: value, kind: "value" });
    at = start + whole.length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), kind: "plain" });
  return parts;
}
