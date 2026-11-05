import type { OrderStatus } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { TransitionGate } from "./gate-schema";

export type MoveRuleInput = {
  context: Pick<OperationContext, "db">;
  from: Pick<OrderStatus, "id" | "restrictsNext">;
  to: Pick<OrderStatus, "id">;
};

export type MoveRule = { allowed: boolean; gates: TransitionGate[] };

/**
 * What the organization says about the move from → to (ADR 0076): allowed unless `from` restricts
 * its moves and does not list `to`, and the gates into `to` from any status or from `from`.
 */
export async function loadMoveRule({ context, from, to }: MoveRuleInput): Promise<MoveRule> {
  const listed = from.restrictsNext
    ? (await context.db.orderStatusTransition.count({
        where: { fromStatusId: from.id, toStatusId: to.id },
      })) > 0
    : true;
  const rows = await context.db.orderStatusGate.findMany({
    where: { toStatusId: to.id, OR: [{ fromStatusId: null }, { fromStatusId: from.id }] },
    select: { key: true },
  });
  return { allowed: listed, gates: [...new Set(rows.map(({ key }) => key))] };
}
