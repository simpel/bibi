import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { nowOf } from "../../time/now";

type Ctx = { context: OperationContext };

/**
 * A layout save may delete pieces only when none of them is a table with an upcoming active hold
 * (a reservation or a block, ADR 0119); past holds go with the table.
 */
export async function checkTablesFree({
  context,
  ids,
}: Ctx & { ids: readonly string[] }): Promise<Result<true>> {
  if (ids.length === 0) return ok({ value: true });
  const held = await context.db.tableHold.findMany({
    where: { elementId: { in: [...ids] }, endsAt: { gt: nowOf({ context }) } },
    select: { elementId: true },
    distinct: ["elementId"],
  });
  if (held.length === 0) return ok({ value: true });
  const message = "Tables with upcoming reservations or blocks cannot be removed from the layout";
  return conflict({
    message,
    issues: held.map((row) => ({ path: `elements.${row.elementId}`, message })),
  });
}

/** Archives the layout's combinations left with fewer than two tables after a save. */
export async function pruneCombinations({ context, layoutId }: Ctx & { layoutId: string }) {
  const combinations = await context.db.tableCombination.findMany({
    where: { layoutId },
    select: { id: true, _count: { select: { members: true } } },
  });
  const broken = combinations.filter((row) => row._count.members < 2).map((row) => row.id);
  if (broken.length > 0) {
    await context.db.tableCombination.updateMany({
      where: { id: { in: broken } },
      data: { status: "ARCHIVED" },
    });
  }
}
