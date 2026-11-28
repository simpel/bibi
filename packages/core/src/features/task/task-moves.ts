import type { OrderStatus } from "@bibi/db";
import type { AppErrorIssue } from "../../errors/app-error";
import { statusBlockers } from "../order/status-rules";
import { TASK_GATES } from "../order-status/gate-schema";
import { type FlowRules, moveRuleOf } from "../order-status/move-rule";

/** What a task move reads of a status. */
export type TaskFlowStatus = Pick<
  OrderStatus,
  "id" | "name" | "closes" | "tasks" | "restrictsNext" | "event"
>;

export type TaskMoveBlockersInput = {
  rules: FlowRules;
  /** The task's status; null for a task that has none yet (then only gates from any status count). */
  from: TaskFlowStatus | null;
  to: TaskFlowStatus;
  /** The task's main assignee (the one gate fact a task has). */
  assigneeId: string | null;
};

const NO_STATUS = { id: "", name: "no status", closes: false, restrictsNext: false } as const;

/**
 * What blocks a task's move (ADR 0121), with the order move rule: a `restrictsNext` source allows
 * only its listed targets, and the gates into the target apply where they read something a task
 * has (`TASK_GATES`); the others are skipped. A quote event moves orders only, so a task enters
 * such a status by hand. Whether the target holds tasks is the caller's check.
 */
export function taskMoveBlockers({
  rules,
  from,
  to,
  assigneeId,
}: TaskMoveBlockersInput): AppErrorIssue[] {
  const source = from ?? NO_STATUS;
  const { allowed, gates } = moveRuleOf({ rules, from: source, to });
  return statusBlockers({
    ...{ from: source, to: { ...to, event: null }, allowed, assigneeId },
    gates: gates.filter((gate) => TASK_GATES.includes(gate)),
  });
}

export type TaskTargetsInput = Omit<TaskMoveBlockersInput, "to"> & {
  /** The organization's active statuses. */
  statuses: readonly TaskFlowStatus[];
};

/** The statuses a task may move to now: those that hold tasks and nothing blocks (ADR 0121). */
export function taskTargets({ statuses, ...input }: TaskTargetsInput): string[] {
  return statuses
    .filter((to) => to.tasks && !to.closes && to.id !== input.from?.id)
    .filter((to) => taskMoveBlockers({ ...input, to }).length === 0)
    .map((to) => to.id);
}
