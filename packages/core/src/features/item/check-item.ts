import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { validateFields } from "../field-definition/field-values";
import { checkChoiceGroups } from "./item-choice-groups";
import { checkComponents } from "./item-components";
import type { Composition } from "./item-composition";
import { checkBehaviourData, checkVenue } from "./item-rules";
import { checkSetups } from "./item-setups";
import type { ItemUpdateInput } from "./schema";

export type CheckItemInput = {
  context: Pick<OperationContext, "db">;
  type: EntityType;
  /** The item being updated; undefined on create. */
  itemId?: string | undefined;
  /** The customer owning the item; null = a catalog item. */
  customerId: string | null;
  data: Omit<ItemUpdateInput, "id" | "fields">;
  /** Parts and choice groups after the change, or undefined when neither is touched. */
  composition?: Composition | undefined;
  /** Full field values after the change, or undefined when fields are not touched. */
  fields: Record<string, unknown> | undefined;
};

/**
 * Everything `item.create` and `item.update` check before writing: behaviour data matches the
 * type, the venue, setups and parts exist (parts without cycles or excess depth), choice groups
 * fit the parts, and field values pass the type's field schema.
 * Returns the validated field values (undefined when untouched).
 */
export async function checkItem({
  context,
  type,
  itemId,
  customerId,
  data,
  composition,
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
    const parts = await checkComponents({
      context,
      parentId: itemId,
      customerId,
      components: data.components,
    });
    if (!parts.ok) return parts;
  }
  if (composition) {
    const partIds = composition.components.map((component) => component.itemId);
    const groups = checkChoiceGroups({ choiceGroups: composition.choiceGroups, partIds });
    if (!groups.ok) return groups;
  }
  if (fields === undefined) return ok({ value: undefined });
  return validateFields({ context, entityTypeId: type.id, values: fields });
}
