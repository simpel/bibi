/** Field names with a localized label in `assistant.approval.fields`. */
export const FIELD_KEYS = [
  "id",
  "name",
  "description",
  "streetAddress",
  "postalCode",
  "city",
  "country",
  "contactEmail",
  "contactPhone",
  "openingHours",
  "defaultVatRatePercent",
  "venueId",
  "floor",
  "areaSqm",
  "ceilingHeightM",
  "hasDaylight",
  "maxCapacity",
  "slug",
  "instructions",
  "allowedTools",
  "resources",
  "scope",
  "markdown",
  "title",
  "value",
] as const;

/** Operations with a localized label in `assistant.approval.operations` (`.` → `_`). */
export const OPERATION_KEYS = [
  "venue_create",
  "venue_update",
  "venue_archive",
  "room_create",
  "room_update",
  "room_archive",
  "skill_create",
  "skill_update",
  "skill_publish",
  "skill_archive",
  "skill_share",
  "skill_import",
  "conversation_archive",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];
export type OperationKey = (typeof OPERATION_KEYS)[number];

/** The label key of an input field, or null for fields shown under their raw name. */
export const fieldKey = ({ key }: { key: string }): FieldKey | null =>
  FIELD_KEYS.find((candidate) => candidate === key) ?? null;

/** The label key of an operation name like `venue.create`, or null for unknown ones. */
export const operationKey = ({ operation }: { operation: string }): OperationKey | null => {
  const key = operation.replaceAll(".", "_");
  return OPERATION_KEYS.find((candidate) => candidate === key) ?? null;
};
