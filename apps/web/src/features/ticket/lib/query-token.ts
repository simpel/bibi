import type { TicketQualifier } from "@bibi/core/schemas";
import { type QueryVocabulary, qualifierOf } from "./query-vocabulary";

/** The word under the caret: `-status:Lead,Of` → key status, head `Lead,`, partial `Of`. */
export type QueryToken = {
  start: number;
  end: number;
  /** The word as typed, `-` included. */
  raw: string;
  negated: boolean;
  key?: TicketQualifier;
  /** The qualifier word as typed (`ansvarig` or `assignee`). */
  word?: string;
  head: string;
  partial: string;
};

type Bounds = { text: string; caret: number };

/** Where the word under the caret starts and ends; spaces inside quotes do not split it. */
function boundsAt({ text, caret }: Bounds) {
  let start = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"') quoted = !quoted;
    if (text[index] !== " " || quoted) continue;
    if (index >= caret) return { start, end: index };
    start = index + 1;
  }
  return { start, end: text.length };
}

export type TokenAtInput = Bounds & { vocabulary: QueryVocabulary };

/** The token around the caret, split into its parts. */
export function tokenAt({ text, caret, vocabulary }: TokenAtInput): QueryToken {
  const { start, end } = boundsAt({ text, caret });
  const raw = text.slice(start, end);
  const negated = raw.startsWith("-");
  const body = negated ? raw.slice(1) : raw;
  const colon = body.indexOf(":");
  if (colon === -1) return { start, end, raw, negated, head: "", partial: body };
  const word = body.slice(0, colon);
  const key = qualifierOf({ word, vocabulary });
  const values = body.slice(colon + 1);
  const comma = values.lastIndexOf(",") + 1;
  const partial = values.slice(comma).replace(/^"|"$/g, "");
  const named = key ? { key, word } : {};
  return { start, end, raw, negated, ...named, head: values.slice(0, comma), partial };
}

/** The value as it goes into the search: quoted when it holds a space or comma. */
export const quoteValue = ({ value }: { value: string }) =>
  /[\s,]/.test(value) ? `"${value}"` : value;
