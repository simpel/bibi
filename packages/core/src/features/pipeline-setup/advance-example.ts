import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { changeOrderStatus } from "../order/change-status-operation";

type Context = { context: OperationContext };

/**
 * The first open status after the entry status, in status order, that is entered by hand (no
 * quote event); null when there is none. Picked by flags, never by name: statuses are renamed.
 */
export async function exampleAdvanceStatusId({ context }: Context): Promise<string | null> {
  const statuses = await context.db.orderStatus.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, entry: true, closes: true, event: true },
  });
  const entry = statuses.findIndex((status) => status.entry);
  if (entry < 0) return null;
  const next = statuses.slice(entry + 1).find((status) => !status.closes && !status.event);
  return next?.id ?? null;
}

export type AdvanceExampleInput = Context & { orderId: string; statusId: string };

/**
 * Moves an example order on through `order.changeStatus`. A move the organization's rules refuse
 * (`CONFLICT`, checked before anything is written) leaves the order where it is.
 */
export async function advanceExample({
  context,
  orderId,
  statusId,
}: AdvanceExampleInput): Promise<Result<boolean>> {
  const input = { orderId, statusId };
  const moved = await runNested({ operation: changeOrderStatus, input, context });
  if (moved.ok) return ok({ value: true });
  return moved.error.code === "CONFLICT" ? ok({ value: false }) : moved;
}
