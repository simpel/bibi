import type { EntityTypeDto, ItemDto, ItemUpdateInput } from "@okazi/core";
import type { ItemFormOutput } from "./item-form-schema";

export type UpdateInputArgs = {
  item: ItemDto;
  values: ItemFormOutput;
  type: EntityTypeDto | undefined;
};

/**
 * Create-shaped values → `item.update` input. Core merges `fields` per key, so a field that was
 * set and is now empty is sent as `null` to clear it.
 */
export function toUpdateInput({ item, values, type }: UpdateInputArgs): ItemUpdateInput {
  const { entityTypeId: _type, fields, ...rest } = values;
  const cleared: Record<string, null> = {};
  for (const { key } of type?.fields ?? []) {
    if (item.fields[key] !== undefined && fields?.[key] === undefined) cleared[key] = null;
  }
  return { id: item.id, ...rest, fields: { ...fields, ...cleared } };
}
