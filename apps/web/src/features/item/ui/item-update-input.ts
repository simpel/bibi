import type { EntityTypeDto, ItemDto, ItemUpdateInput } from "@okazi/core";
import { fieldsPatch } from "@/components/typed-fields/raw-fields";
import type { ItemFormOutput } from "./item-form-schema";

export type UpdateInputArgs = {
  item: ItemDto;
  values: ItemFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `item.update` input; emptied fields are cleared with `null`. */
export function toUpdateInput({ item, values, type }: UpdateInputArgs): ItemUpdateInput {
  const { entityTypeId: _type, fields, ...rest } = values;
  return { id: item.id, ...rest, fields: fieldsPatch({ type, stored: item.fields, fields }) };
}
