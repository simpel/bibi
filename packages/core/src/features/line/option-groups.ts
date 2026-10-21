import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { PriceEffect } from "../item/customisation-group-schema";

type Db = Pick<OperationContext, "db">;

/** One option of a group on the line's item, as choosing reads it. */
export type ChoosableOption = { itemId: string; name: string; priceEffect: PriceEffect };

export type OptionGroup = {
  name: string;
  minPick: number;
  maxPick: number;
  options: ChoosableOption[];
};

/** The item's customisation groups in order, each with its active options in order (ADR 0059). */
export async function loadOptionGroups({
  context,
  itemId,
}: {
  context: Db;
  itemId: string;
}): Promise<OptionGroup[]> {
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId },
    orderBy: { position: "asc" },
    include: {
      options: {
        where: { item: { status: "ACTIVE" } },
        orderBy: { position: "asc" },
        include: { item: { select: { name: true } } },
      },
    },
  });
  return groups.map(({ name, minPick, maxPick, options }) => ({
    ...{ name, minPick, maxPick },
    options: options.map(({ itemId: id, priceEffect, item }) => ({
      ...{ itemId: id, name: item.name, priceEffect },
    })),
  }));
}

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "optionItemIds", message }] });

export type CheckChoiceInput = { groups: readonly OptionGroup[]; optionItemIds: readonly string[] };

/**
 * Every chosen id is an option of one of the groups, and each group gets between its minPick
 * and maxPick of them (a group with minPick 0 can be skipped). Returns the chosen options in
 * group order.
 */
export function checkChoice({
  groups,
  optionItemIds,
}: CheckChoiceInput): Result<ChoosableOption[]> {
  const offered = groups.flatMap((group) => group.options.map((option) => option.itemId));
  if (optionItemIds.some((id) => !offered.includes(id))) {
    return problem({ message: "A chosen item is not an option of the line's item" });
  }
  const chosen: ChoosableOption[] = [];
  for (const { name, minPick, maxPick, options } of groups) {
    const picked = options.filter((option) => optionItemIds.includes(option.itemId));
    if (picked.length < minPick || picked.length > maxPick) {
      const range = minPick === maxPick ? `${minPick}` : `${minPick} to ${maxPick}`;
      return problem({ message: `${name}: choose ${range} of its options` });
    }
    chosen.push(...picked);
  }
  return ok({ value: chosen });
}
