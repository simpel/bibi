import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { validateFields } from "./item-fields";
import { checkBehaviourData, checkVenue } from "./item-rules";
import { checkSetups } from "./item-setups";
import type { ItemUpdateInput } from "./schema";

export type CheckItemInput = {
  context: Pick<OperationContext, "db">;
  type: EntityType;
  data: Omit<ItemUpdateInput, "id" | "fields">;
  /** Full field values after the change, or undefined when fields are not touched. */
  fields: Record<string, unknown> | undefined;
};

/**
 * Everything `item.create` and `item.update` check before writing: behaviour data matches the
 * type, the venue and setups exist, and field values pass the type's field schema.
 * Returns the validated field values (undefined when untouched).
 */
export async function checkItem({
  context,
  type,
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
  if (fields === undefined) return ok({ value: undefined });
  return validateFields({ context, entityTypeId: type.id, values: fields });
}
