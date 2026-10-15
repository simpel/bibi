import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { validateFields } from "../field-definition/field-values";
import { checkComponents } from "./item-components";
import { checkBehaviourData, checkVenue } from "./item-rules";
import { checkSetups } from "./item-setups";
import type { ItemUpdateInput } from "./schema";

export type CheckItemInput = {
  context: Pick<OperationContext, "db">;
  type: EntityType;
  /** The item being updated; undefined on create. */
  itemId?: string | undefined;
  data: Omit<ItemUpdateInput, "id" | "fields">;
  /** Full field values after the change, or undefined when fields are not touched. */
  fields: Record<string, unknown> | undefined;
};

/**
 * Everything `item.create` and `item.update` check before writing: behaviour data matches the
 * type, the venue, setups and parts exist (parts without cycles or excess depth), and field values pass the type's field schema.
 * Returns the validated field values (undefined when untouched).
 */
export async function checkItem({
  context,
  type,
  itemId,
  data,
  fields,
}: CheckItemInput): Promise<Result<Record<string, unknown> | undefined>> {
  const behaviour = checkBehaviourData({ behaviours: type.behaviours, data });
  if (!behaviour.ok) return behaviour;
  const venue = await checkVenue({ context, venueId: data.venueId });
  if (!venue.ok) return venue;
  if (data.setups) {
    const setups = await checkSetups({ context, setups: data.setups });
    if (!setups.ok) return setups;
  }
  if (data.components) {
    const parts = await checkComponents({ context, parentId: itemId, components: data.components });
    if (!parts.ok) return parts;
  }
  if (fields === undefined) return ok({ value: undefined });
  return validateFields({ context, entityTypeId: type.id, values: fields });
}
