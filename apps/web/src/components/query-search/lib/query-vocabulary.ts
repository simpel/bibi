/**
 * What a search understands: its qualifiers, the fixed values each takes (canonical English words)
 * and the fields `no:` names. A list (orders, run sheets) brings its own; the generic search
 * code reads only this.
 */
export type QuerySpec = {
  qualifiers: readonly string[];
  fixed: Readonly<Record<string, readonly string[]>>;
  emptyFields: readonly string[];
};

/**
 * The search words of the UI language (`order.query`, `runSheet.query` in sv/en), e.g.
 * assignee → `ansvarig`. Core understands only the canonical English words; the web maps between
 * them (ADR 0009).
 */
export type QueryVocabulary = QuerySpec & {
  words: Record<string, string>;
  values: Record<string, string>;
  empty: Record<string, string>;
};

/** Lower case without accents, so `nar:` and `NÄR:` both mean `när:`. */
export const fold = ({ text }: { text: string }) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export type QualifierOfInput = { word: string | undefined; vocabulary: QueryVocabulary };

/** The qualifier a typed word names: the UI language's word or the canonical English one. */
export function qualifierOf({ word, vocabulary }: QualifierOfInput): string | undefined {
  if (!word) return undefined;
  const typed = fold({ text: word });
  return vocabulary.qualifiers.find(
    (key) => fold({ text: key }) === typed || fold({ text: vocabulary.words[key] ?? "" }) === typed,
  );
}

/** The fixed values a qualifier takes, with their words in the UI language. */
export function fixedValuesOf({ key, vocabulary }: { key: string; vocabulary: QueryVocabulary }) {
  if (key === "no")
    return vocabulary.emptyFields.map((value) => ({
      value,
      word: vocabulary.empty[value] ?? value,
    }));
  return (vocabulary.fixed[key] ?? []).map((value) => ({
    value,
    word: vocabulary.values[value] ?? value,
  }));
}
