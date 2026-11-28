import type { OrderStatus } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { TransitionGate } from "./gate-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** The organization's move rules (ADR 0076): its listed transitions and its gates. */
export type FlowRules = {
  transitions: readonly { fromStatusId: string; toStatusId: string }[];
  gates: readonly { fromStatusId: string | null; toStatusId: string; key: TransitionGate }[];
};

/** Every transition and gate of the organization (a handful of rows), read once per move or board. */
export async function loadFlowRules({ context }: Db): Promise<FlowRules> {
  const [transitions, gates] = await Promise.all([
    context.db.orderStatusTransition.findMany({ select: { fromStatusId: true, toStatusId: true } }),
    context.db.orderStatusGate.findMany({
      select: { fromStatusId: true, toStatusId: true, key: true },
    }),
  ]);
  return { transitions, gates };
}

export type MoveRule = { allowed: boolean; gates: TransitionGate[] };

export type MoveRuleOfInput = {
  rules: FlowRules;
  from: Pick<OrderStatus, "id" | "restrictsNext">;
  to: Pick<OrderStatus, "id">;
};

/**
 * What the organization says about the move from → to (ADR 0076): allowed unless `from` restricts
 * its moves and does not list `to`, and the gates into `to` from any status or from `from`. The
 * same rule for orders and tasks (ADR 0121).
 */
export function moveRuleOf({ rules, from, to }: MoveRuleOfInput): MoveRule {
  const allowed =
    !from.restrictsNext ||
    rules.transitions.some((row) => row.fromStatusId === from.id && row.toStatusId === to.id);
  const keys = rules.gates
    .filter((row) => row.toStatusId === to.id)
    .filter((row) => row.fromStatusId === null || row.fromStatusId === from.id)
    .map((row) => row.key);
  return { allowed, gates: [...new Set(keys)] };
}

export type MoveRuleInput = Db & Omit<MoveRuleOfInput, "rules">;

/** `moveRuleOf` with the organization's rules read first. */
export async function loadMoveRule({ context, from, to }: MoveRuleInput): Promise<MoveRule> {
  return moveRuleOf({ rules: await loadFlowRules({ context }), from, to });
}
