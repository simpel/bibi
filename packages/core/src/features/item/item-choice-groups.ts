import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemChoiceGroupInput } from "./choice-group-schema";

type Groups = readonly ItemChoiceGroupInput[];

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "choiceGroups", message }] });

export type CheckChoiceGroupsInput = {
  choiceGroups: Groups;
  /** Ids of the item's parts after the change. */
  partIds: readonly string[];
};

/**
 * Each group has a unique name and offers parts of the item, each part in at most one group,
 * with `0 <= minPick <= maxPick <= number of options` (ADR 0021).
 */
export function checkChoiceGroups({ choiceGroups, partIds }: CheckChoiceGroupsInput): Result<true> {
  const names = choiceGroups.map((group) => group.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    return problem({ message: "Two choice groups have the same name" });
  }
  const options = choiceGroups.flatMap((group) => group.itemIds);
  if (new Set(options).size !== options.length) {
    return problem({ message: "A part is an option in more than one choice group" });
  }
  if (options.some((id) => !partIds.includes(id))) {
    return problem({ message: "A choice group option is not one of the item's parts" });
  }
  for (const { name, minPick, maxPick, itemIds } of choiceGroups) {
    if (minPick > maxPick) {
      return problem({ message: `${name}: minPick cannot be greater than maxPick` });
    }
    if (maxPick > itemIds.length) {
      return problem({ message: `${name}: maxPick cannot exceed the number of options` });
    }
  }
  return ok({ value: true });
}

export type ReplaceChoiceGroupsInput = {
  context: OperationContext;
  itemId: string;
  choiceGroups: Groups;
};

/** Replaces the item's choice groups and links the parts that are options. Runs after the parts. */
export async function replaceChoiceGroups({
  context,
  itemId,
  choiceGroups,
}: ReplaceChoiceGroupsInput) {
  await context.db.itemComponent.updateMany({
    where: { parentId: itemId },
    data: { choiceGroupId: null },
  });
  await context.db.itemChoiceGroup.deleteMany({ where: { itemId } });
  for (const [position, { itemIds, ...group }] of choiceGroups.entries()) {
    const row = await context.db.itemChoiceGroup.create({
      data: { ...group, itemId, position, organizationId: context.organizationId },
    });
    await context.db.itemComponent.updateMany({
      where: { parentId: itemId, partId: { in: itemIds } },
      data: { choiceGroupId: row.id },
    });
  }
}
