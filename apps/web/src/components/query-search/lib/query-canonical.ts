import { ORDER_QUERY_PIECE, ORDER_QUERY_TOKEN } from "@bibi/core/schemas";
import { fixedValuesOf, fold, type QueryVocabulary, qualifierOf } from "./query-vocabulary";

type CanonicalInput = { q: string; vocabulary: QueryVocabulary };

/** A fixed value typed in the UI language (or English) as its canonical word; others unchanged. */
function canonicalValue({
  key,
  piece,
  vocabulary,
}: {
  key: string;
  piece: string;
  vocabulary: QueryVocabulary;
}) {
  const typed = fold({ text: piece });
  const match = fixedValuesOf({ key, vocabulary }).find(
    ({ value, word }) => fold({ text: word }) === typed || value === typed,
  );
  return match?.value ?? piece;
}

/**
 * The search as core reads it: qualifier words and fixed values of the UI language become the
 * canonical English ones (`ansvarig:jag` → `assignee:me`); names and free text stay as typed.
 */
export function toCanonicalQuery({ q, vocabulary }: CanonicalInput): string {
  return q.replace(ORDER_QUERY_TOKEN, (whole, minus = "", word, value = "") => {
    const key = qualifierOf({ word, vocabulary });
    if (!key) return whole;
    const values = (value as string).replace(ORDER_QUERY_PIECE, (piece, quoted) =>
      quoted === undefined ? canonicalValue({ key, piece, vocabulary }) : piece,
    );
    return `${minus}${key}:${values}`;
  });
}
