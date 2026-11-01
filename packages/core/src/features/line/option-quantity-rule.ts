import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { LineRecord } from "./schema";

export type CheckOptionQuantityInput = {
  context: Pick<OperationContext, "db">;
  before: LineRecord;
  /** The quantity the change gives the line; undefined = unchanged. */
  quantity: number | null | undefined;
};

/** Whether the option line's option is in a split group of its parent line's item (ADR 0082). */
async function isSplitOption({ context, before }: Omit<CheckOptionQuantityInput, "quantity">) {
  if (!before.parentLineId || !before.itemId) return false;
  const parent = await context.db.line.findFirst({
    where: { id: before.parentLineId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { itemId: true },
  });
  if (!parent?.itemId) return false;
  const option = await context.db.itemCustomisationOption.findFirst({
    where: { itemId: before.itemId, group: { itemId: parent.itemId, split: true } },
    select: { id: true },
  });
  return option !== null;
}

/**
 * ADR 0082: an option line has a quantity of its own only when its option's group is split; any
 * other option line counts its parent's quantity (null). An unchanged quantity (an option line
 * chosen before ADR 0082 copied its parent's) passes. Other lines are not affected.
 */
export async function checkOptionQuantity({
  context,
  before,
  quantity,
}: CheckOptionQuantityInput): Promise<Result<true>> {
  const unchanged = quantity === undefined || quantity === null || quantity === before.quantity;
  if (before.priceEffect === null || unchanged) return ok({ value: true });
  if (await isSplitOption({ context, before })) return ok({ value: true });
  const message =
    "The option applies to the whole line: only an option of a split group has a quantity";
  return invalid({ message, issues: [{ path: "quantity", message }] });
}
