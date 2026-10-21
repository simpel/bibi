import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemCustomisationGroupInput } from "./customisation-group-schema";

type Groups = readonly ItemCustomisationGroupInput[];

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "customisationGroups", message }] });

export type CheckCustomisationGroupsInput = {
  context: Pick<OperationContext, "db">;
  customisationGroups: Groups;
  /** The item the groups hang on; undefined on create. */
  itemId: string | undefined;
  /** The customer owning the item; null = a catalog item, whose options are catalog items. */
  customerId: string | null;
};

/** Unique names and `0 <= minPick <= maxPick <= number of options` in every group. */
function checkShape({ customisationGroups }: { customisationGroups: Groups }): Result<true> {
  const names = customisationGroups.map((group) => group.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    return problem({ message: "Two customisation groups have the same name" });
  }
  for (const { name, minPick, maxPick, options } of customisationGroups) {
    if (minPick > maxPick) {
      return problem({ message: `${name}: minPick cannot be greater than maxPick` });
    }
    if (maxPick > options.length) {
      return problem({ message: `${name}: maxPick cannot exceed the number of options` });
    }
  }
  return ok({ value: true });
}

/**
 * ADR 0059: groups hang on any item and offer other active items, each an option in at most one
 * group of the item. An option is a catalog item or a bundle of the item's own customer.
 */
export async function checkCustomisationGroups({
  context,
  customisationGroups,
  itemId,
  customerId,
}: CheckCustomisationGroupsInput): Promise<Result<true>> {
  const shape = checkShape({ customisationGroups });
  if (!shape.ok) return shape;
  const ids = customisationGroups.flatMap((group) => group.options.map((option) => option.itemId));
  if (new Set(ids).size !== ids.length) {
    return problem({ message: "An item is an option more than once on the same item" });
  }
  if (itemId && ids.includes(itemId)) {
    return problem({ message: "An item cannot be an option of itself" });
  }
  const owners = [{ customerId: null }, ...(customerId ? [{ customerId }] : [])];
  if ((await context.db.item.count({ where: { id: { in: ids }, OR: owners } })) !== ids.length) {
    return problem({ message: "Unknown option, or an option that belongs to another customer" });
  }
  return ok({ value: true });
}

export type ReplaceCustomisationGroupsInput = {
  context: OperationContext;
  itemId: string;
  customisationGroups: Groups;
};

/** Replaces the item's customisation groups with their options (removed with their group). */
export async function replaceCustomisationGroups({
  context,
  itemId,
  customisationGroups,
}: ReplaceCustomisationGroupsInput) {
  await context.db.itemCustomisationGroup.deleteMany({ where: { itemId } });
  for (const [position, { options, ...group }] of customisationGroups.entries()) {
    const row = await context.db.itemCustomisationGroup.create({
      data: { ...group, itemId, position, organizationId: context.organizationId },
    });
    await context.db.itemCustomisationOption.createMany({
      data: options.map((option, index) => ({
        ...option,
        groupId: row.id,
        position: index,
        organizationId: context.organizationId,
      })),
    });
  }
}
