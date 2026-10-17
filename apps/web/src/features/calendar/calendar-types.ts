/** `?type=all` shows every bookable type; no `type` means the default type. */
export const ALL_TYPES = "all";

export type SpaceRow = { id: string; name: string; venueId: string | null; entityTypeId: string };

export type TypeOption = { id: string; name: string };

export type SelectSpacesInput = {
  spaces: readonly SpaceRow[];
  types: readonly TypeOption[];
  typeId: string | undefined;
};

export type SelectedSpaces = {
  /** Bookable types that have at least one space, by name. */
  types: TypeOption[];
  /** The type shown, or `undefined` for all types. */
  typeId: string | undefined;
  spaces: SpaceRow[];
};

/** The type with the most spaces (ties by name): rooms, not the guides and equipment. */
function defaultType({ spaces, types }: { spaces: readonly SpaceRow[]; types: TypeOption[] }) {
  const count = ({ id }: TypeOption) => spaces.filter((space) => space.entityTypeId === id).length;
  return [...types].sort((a, b) => count(b) - count(a) || a.name.localeCompare(b.name))[0];
}

/**
 * Keeps the calendar to one kind of space at a time (ADR 0036, clutter free): the type from the
 * URL when it has spaces, otherwise the type with the most spaces. `all` shows every type.
 */
export function selectSpaces({ spaces, types, typeId }: SelectSpacesInput): SelectedSpaces {
  const used = new Set(spaces.map(({ entityTypeId }) => entityTypeId));
  const options = types
    .filter(({ id }) => used.has(id))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (typeId === ALL_TYPES) return { types: options, typeId: undefined, spaces: [...spaces] };
  const chosen = options.find(({ id }) => id === typeId) ?? defaultType({ spaces, types: options });
  if (!chosen) return { types: options, typeId: undefined, spaces: [...spaces] };
  const shown = spaces.filter(({ entityTypeId }) => entityTypeId === chosen.id);
  return { types: options, typeId: chosen.id, spaces: shown };
}
