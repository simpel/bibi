import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { type PoolTarget, poolUnitsWhere } from "../item/pool-free-units";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckNeedingItemInput = Db & { itemId: string };

/** The needing item is an active item of the organization. */
export async function checkNeedingItem({ context, itemId }: CheckNeedingItemInput) {
  const item = await context.db.item.findFirst({ where: { id: itemId }, select: { id: true } });
  return item ? ok({ value: true as const }) : notFound({ entity: "Item" });
}

export type CheckDemandTargetInput = Db & {
  itemId: string;
  target: PoolTarget;
};

/**
 * The target is one bookable item other than the needing item, or a bookable item type with
 * list values of its own list fields (the checks of `item.freeUnits`, ADR 0059).
 */
export async function checkDemandTarget({
  context,
  itemId,
  target,
}: CheckDemandTargetInput): Promise<Result<true>> {
  if (target.itemId && target.itemId === itemId) {
    const message = "An item cannot need itself";
    return invalid({ message, issues: [{ path: "targetItemId", message }] });
  }
  const where = await poolUnitsWhere({ context, input: target });
  if (!where.ok) {
    const issues = where.error.issues.map((issue) => ({
      ...issue,
      path: issue.path === "itemId" ? "targetItemId" : issue.path,
    }));
    return where.error.code === "VALIDATION"
      ? invalid({ message: where.error.message, issues })
      : where;
  }
  return ok({ value: true });
}
