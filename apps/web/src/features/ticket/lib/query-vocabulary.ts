import {
  TICKET_EMPTY_FIELDS,
  TICKET_HOLDS_VALUES,
  TICKET_IS_VALUES,
  TICKET_QUALIFIERS,
  type TicketQualifier,
} from "@bibi/core/schemas";

/** Fixed qualifier values the UI language names: `me`, `open`, `closed`, `expired`, `soon`. */
export const QUERY_FIXED_VALUES = ["me", ...TICKET_IS_VALUES, ...TICKET_HOLDS_VALUES] as const;

export type QueryFixedValue = (typeof QUERY_FIXED_VALUES)[number];
export type QueryEmptyField = (typeof TICKET_EMPTY_FIELDS)[number];

/**
 * The search words of the UI language (`ticket.query` in sv/en), e.g. assignee → `ansvarig`.
 * Core understands only the canonical English words; the web maps between them (ADR 0009).
 */
export type QueryVocabulary = {
  words: Record<TicketQualifier, string>;
  values: Record<QueryFixedValue, string>;
  empty: Record<QueryEmptyField, string>;
};

/** Lower case without accents, so `nar:` and `NÄR:` both mean `när:`. */
export const fold = ({ text }: { text: string }) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export type QualifierOfInput = { word: string | undefined; vocabulary: QueryVocabulary };

/** The qualifier a typed word names: the UI language's word or the canonical English one. */
export function qualifierOf({ word, vocabulary }: QualifierOfInput): TicketQualifier | undefined {
  if (!word) return undefined;
  const typed = fold({ text: word });
  return TICKET_QUALIFIERS.find(
    (key) => fold({ text: key }) === typed || fold({ text: vocabulary.words[key] }) === typed,
  );
}

/** The fixed values a qualifier takes, with their words in the UI language. */
export function fixedValuesOf({
  key,
  vocabulary,
}: {
  key: TicketQualifier;
  vocabulary: QueryVocabulary;
}) {
  if (key === "no")
    return TICKET_EMPTY_FIELDS.map((value) => ({ value, word: vocabulary.empty[value] }));
  const fixed: readonly QueryFixedValue[] =
    key === "assignee" || key === "follower"
      ? ["me"]
      : key === "is"
        ? TICKET_IS_VALUES
        : key === "holds"
          ? TICKET_HOLDS_VALUES
          : [];
  return fixed.map((value) => ({ value, word: vocabulary.values[value] }));
}
