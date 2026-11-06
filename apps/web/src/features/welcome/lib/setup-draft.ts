import type { SetupCategory, SetupPreset, SetupPresetKey } from "@bibi/core/setup-presets";

/** One type on the spaces, food or extras step; `key` is set for the kind's own types. */
export type TypeChoice = {
  key: string | null;
  name: string;
  category: SetupCategory;
  bookable: boolean;
  checked: boolean;
};

/** What the setup steps collect before review (ADR 0061); nothing is saved until Activate. */
export type SetupDraft = { kind: SetupPresetKey | null; types: TypeChoice[] };

export const EMPTY_DRAFT: SetupDraft = { kind: null, types: [] };

export type DraftFromKindInput = {
  preset: SetupPreset;
  /** The type's label in the user's language (`welcome.types.<key>`), else its English name. */
  label: (type: { key: string; name: string }) => string;
};

/** Picking a kind prefills the type steps with its types; any type can be removed or added. */
export function draftFromKind({ preset, label }: DraftFromKindInput): SetupDraft {
  return {
    kind: preset.key as SetupPresetKey,
    types: preset.itemTypes.map((type) => ({
      key: type.key,
      name: label(type),
      category: type.category,
      bookable: type.bookable,
      checked: true,
    })),
  };
}

/** The ticked types with a name, as `draftFromTypes` wants them. */
export function chosenTypes({ draft }: { draft: SetupDraft }) {
  return draft.types
    .filter((type) => type.checked && type.name.trim().length > 0)
    .map((type) => ({ name: type.name.trim(), bookable: type.bookable }));
}

/** A type's setup step; a type from before categories falls back on its bookable flag. */
export function categoryOf({ type }: { type: TypeChoice }): SetupCategory {
  return type.category ?? (type.bookable ? "spaces" : "food");
}
