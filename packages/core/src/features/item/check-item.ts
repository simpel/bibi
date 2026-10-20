import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { validateFields } from "../field-definition/field-values";
import type { CheckedFields } from "../field-definition/split-links";
import type { Composition } from "./item-composition";
import { checkCustomisationGroups } from "./item-customisation-groups";
import { checkParts } from "./item-parts";
import { checkCapabilityData, checkVenue } from "./item-rules";
import { checkSetups } from "./item-setups";
import type { ItemUpdateInput } from "./schema";

export type CheckItemInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  type: EntityType;
  /** The item being updated; undefined on create. */
  itemId?: string | undefined;
  /** The customer owning the item; null = a catalog item. */
  customerId: string | null;
  data: Omit<ItemUpdateInput, "id" | "fields">;
  /** Parts and customisation groups after the change, or undefined when neither is touched. */
  composition?: Composition | undefined;
  /** Full field values after the change, or undefined when fields are not touched. */
  fields: Record<string, unknown> | undefined;
};

/**
 * Everything `item.create` and `item.update` check before writing: capability data matches the
 * type, the venue, setups and parts exist (parts without cycles or excess depth), customisation groups
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
}: CheckItemInput): Promise<Result<CheckedFields | undefined>> {
  const capability = checkCapabilityData({ capabilities: type.capabilities, data });
  if (!capability.ok) return capability;
  const venue = await checkVenue({ context, venueId: data.venueId });
  if (!venue.ok) return venue;
  if (data.setups) {
    const setups = await checkSetups({ context, setups: data.setups });
    if (!setups.ok) return setups;
  }
  if (data.parts) {
    const parts = await checkParts({
      context,
      parentId: itemId,
      customerId,
      parts: data.parts,
    });
    if (!parts.ok) return parts;
  }
  if (composition) {
    const partIds = composition.parts.map((part) => part.itemId);
    const groups = checkCustomisationGroups({
      customisationGroups: composition.customisationGroups,
      partIds,
    });
    if (!groups.ok) return groups;
  }
  if (fields === undefined) return ok({ value: undefined });
  return validateFields({ context, entityTypeId: type.id, values: fields });
}
