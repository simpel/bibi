import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemCustomisationGroupInput } from "./customisation-group-schema";

type Groups = readonly ItemCustomisationGroupInput[];

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "customisationGroups", message }] });

export type CheckCustomisationGroupsInput = {
  customisationGroups: Groups;
  /** Ids of the item's parts after the change. */
  partIds: readonly string[];
};

/**
 * Each group has a unique name and offers parts of the item, each part in at most one group,
 * with `0 <= minPick <= maxPick <= number of options` (ADR 0021).
 */
export function checkCustomisationGroups({
  customisationGroups,
  partIds,
}: CheckCustomisationGroupsInput): Result<true> {
  const names = customisationGroups.map((group) => group.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    return problem({ message: "Two customisation groups have the same name" });
  }
  const options = customisationGroups.flatMap((group) => group.itemIds);
  if (new Set(options).size !== options.length) {
    return problem({ message: "A part is an option in more than one customisation group" });
  }
  if (options.some((id) => !partIds.includes(id))) {
    return problem({ message: "A customisation group option is not one of the item's parts" });
  }
  for (const { name, minPick, maxPick, itemIds } of customisationGroups) {
    if (minPick > maxPick) {
      return problem({ message: `${name}: minPick cannot be greater than maxPick` });
    }
    if (maxPick > itemIds.length) {
      return problem({ message: `${name}: maxPick cannot exceed the number of options` });
    }
  }
  return ok({ value: true });
}

export type ReplaceCustomisationGroupsInput = {
  context: OperationContext;
  itemId: string;
  customisationGroups: Groups;
};

/** Replaces the item's customisation groups and links the parts that are options. Runs after the parts. */
export async function replaceCustomisationGroups({
  context,
  itemId,
  customisationGroups,
}: ReplaceCustomisationGroupsInput) {
  await context.db.itemPart.updateMany({
    where: { parentId: itemId },
    data: { customisationGroupId: null },
  });
  await context.db.itemCustomisationGroup.deleteMany({ where: { itemId } });
  for (const [position, { itemIds, ...group }] of customisationGroups.entries()) {
    const row = await context.db.itemCustomisationGroup.create({
      data: { ...group, itemId, position, organizationId: context.organizationId },
    });
    await context.db.itemPart.updateMany({
      where: { parentId: itemId, partId: { in: itemIds } },
      data: { customisationGroupId: row.id },
    });
  }
}
