import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { PriceEffect } from "../item/customisation-group-schema";
import type { ChosenOption } from "./choose-options-schema";

type Db = Pick<OperationContext, "db">;

/** One option of a group on the line's item, as choosing reads it. */
export type ChoosableOption = { itemId: string; name: string; priceEffect: PriceEffect };

export type OptionGroup = {
  id: string;
  name: string;
  minPick: number;
  maxPick: number;
  split: boolean;
  options: ChoosableOption[];
};

/** A chosen option with its quantity: set in a split group, null in a normal one (ADR 0082). */
export type ChosenLineOption = ChoosableOption & { quantity: number | null };

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
  return groups.map(({ id, name, minPick, maxPick, split, options }) => ({
    ...{ id, name, minPick, maxPick, split },
    options: options.map(({ itemId: optionId, priceEffect, item }) => ({
      ...{ itemId: optionId, name: item.name, priceEffect },
    })),
  }));
}

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "options", message }] });

/** ADR 0082: a quantity is required in a split group and refused in a normal one. */
function quantityOf({ group, chosen }: { group: OptionGroup; chosen: ChosenOption }) {
  const quantity = chosen.quantity ?? null;
  if (group.split && quantity === null) {
    return problem({ message: `${group.name}: give each chosen option a quantity` });
  }
  if (!group.split && quantity !== null) {
    return problem({ message: `${group.name}: its options apply to the whole line, no quantity` });
  }
  return ok({ value: quantity });
}

export type CheckChoiceInput = { groups: readonly OptionGroup[]; options: readonly ChosenOption[] };

/**
 * Every chosen id is an option of one of the groups, each group gets between its minPick and
 * maxPick distinct options (a group with minPick 0 can be skipped), and quantities are given
 * exactly in split groups (ADR 0082). Returns the chosen options in group order.
 */
export function checkChoice({ groups, options }: CheckChoiceInput): Result<ChosenLineOption[]> {
  const offered = groups.flatMap((group) => group.options.map((option) => option.itemId));
  if (options.some(({ itemId }) => !offered.includes(itemId))) {
    return problem({ message: "A chosen item is not an option of the line's item" });
  }
  const chosen: ChosenLineOption[] = [];
  for (const group of groups) {
    const { name, minPick, maxPick } = group;
    const picked = group.options.flatMap((option) => {
      const match = options.find(({ itemId }) => itemId === option.itemId);
      return match ? [{ option, match }] : [];
    });
    if (picked.length < minPick || picked.length > maxPick) {
      const range = minPick === maxPick ? `${minPick}` : `${minPick} to ${maxPick}`;
      return problem({ message: `${name}: choose ${range} of its options` });
    }
    for (const { option, match } of picked) {
      const quantity = quantityOf({ group, chosen: match });
      if (!quantity.ok) return quantity;
      chosen.push({ ...option, quantity: quantity.value });
    }
  }
  return ok({ value: chosen });
}
