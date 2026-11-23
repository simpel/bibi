import type { VocabularyDto } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";

/** A list whose values a requirement can count, with its values. */
export type CountedList = { id: string; name: string; values: NamedOption[] };

export type CountedListsInput = {
  vocabularies: readonly VocabularyDto[];
  /** The lists the run sheets count; null when the caller may not read run sheet definitions. */
  runSheetListIds: readonly string[] | null;
};

/**
 * The lists a requirement counts against: those a run sheet counts, so a list used only for a
 * field's choices (a severity, say) is left out. With no run sheet naming a list, every list.
 */
export function countedLists({ vocabularies, runSheetListIds }: CountedListsInput): CountedList[] {
  const active = vocabularies.filter((list) => list.status === "ACTIVE");
  const named = new Set(runSheetListIds ?? []);
  const counted = active.filter((list) => named.has(list.id));
  return (counted.length > 0 ? counted : active).map(({ id, name, values }) => ({
    id,
    name,
    values: values.map((value) => ({ id: value.id, name: value.name })),
  }));
}
