import type { EntityTypeDto, ItemDto, ItemUpdateInput } from "@bibi/core";
import { fieldsPatch } from "@/components/typed-fields/raw-fields";
import type { ItemFormOutput } from "./item-form-schema";

/** The parts of an item its page edits in place, each from its own pencil. */
export type ItemEditGroup =
  | "picture"
  | "description"
  | "venue"
  | "field"
  | "price"
  | "timing"
  | "layouts"
  | "parts"
  | "customisations";

/** Which update properties each group sends (`field` sends one own field, by `fieldKey`). */
const GROUP_KEYS = {
  picture: ["icon", "imageKey"],
  description: ["description"],
  venue: ["venueId"],
  field: [],
  price: ["priceMinor", "priceUnit", "vatRatePercent"],
  timing: ["defaultDurationMinutes", "setupMinutes", "teardownMinutes"],
  layouts: ["maxPeople"],
  parts: ["parts"],
  customisations: ["customisationGroups"],
} as const satisfies Record<ItemEditGroup, readonly (keyof ItemUpdateInput)[]>;

export type UpdateInputArgs = {
  item: ItemDto;
  values: ItemFormOutput;
  type: EntityTypeDto | undefined;
  /** Only these groups are sent; left out = everything the form has. */
  groups?: readonly ItemEditGroup[] | undefined;
  /** The own field the `field` group sends. */
  fieldKey?: string | undefined;
};

/** Create-shaped values → `item.update` input; emptied fields are cleared with `null`. */
export function toUpdateInput({
  item,
  values,
  type,
  groups,
  fieldKey,
}: UpdateInputArgs): ItemUpdateInput {
  const { entityTypeId: _type, fields, ...rest } = values;
  const patch = fieldsPatch({ type, stored: item.fields, fields });
  if (!groups) return { id: item.id, ...rest, fields: patch };
  const input: ItemUpdateInput = { id: item.id };
  for (const group of groups) {
    for (const key of GROUP_KEYS[group]) {
      if (key in rest) Object.assign(input, { [key]: rest[key as keyof typeof rest] });
    }
  }
  if (!groups.includes("field") || !fieldKey) return input;
  return { ...input, fields: { [fieldKey]: patch[fieldKey] ?? null } };
}
