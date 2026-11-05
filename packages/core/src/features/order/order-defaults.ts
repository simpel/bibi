import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The status a new order gets: the active `entry` status (ADR 0043). Every organization is
 * provisioned with one, and the last one cannot be archived or lose its flag.
 */
export async function entryStatusId({ context }: Db): Promise<Result<string>> {
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { entry: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (orderStatus) return ok({ value: orderStatus.id });
  return conflict({ message: "The organization has no entry status (orderStatus.list)" });
}

/**
 * The next reference number of the organization (highest + 1, archived orders included). Two
 * concurrent creates can pick the same number; the unique index then refuses one (`CONFLICT`).
 */
export async function nextReference({ context }: Db): Promise<number> {
  const top = await context.db.order.aggregate({
    where: { status: { in: ["ACTIVE", "ARCHIVED"] } },
    _max: { reference: true },
  });
  return (top._max.reference ?? 0) + 1;
}
