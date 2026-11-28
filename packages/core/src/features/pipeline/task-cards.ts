import type { OrderStatus } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { mainAssigneesOf } from "../assignment/load-assignment";
import { subjectIdFilter } from "../assignment/subject-filter";
import { loadFlowRules } from "../order-status/move-rule";
import { taskTargets } from "../task/task-moves";
import { isOverdue } from "../task/to-task-dto";
import { CARD_LIMIT } from "./load-cards";
import type { PipelineBoardInput, PipelineTaskCard } from "./schema";

/** A task card before it is placed in a column of the board. */
export type LoadedTaskCard = Omit<PipelineTaskCard, "columnId">;

export type LoadTaskCardsInput = {
  context: Pick<OperationContext, "db" | "permissions" | "now">;
  input: Pick<PipelineBoardInput, "assigneeId" | "entityTypeId">;
  /** The board's statuses. */
  statusIds: string[];
  /** Every active status of the organization (the move targets). */
  statuses: readonly OrderStatus[];
};

/**
 * The board's task cards (ADR 0121): open, active tasks without an order in one of its statuses,
 * by due time (none last), with where each may move now (`taskTargets`, the rule `task.move`
 * checks). A view field of the task feature: none without `task:read` (ADR 0071). An order type
 * filter cannot apply to a task, so it hides them; the assignee filter applies.
 */
export async function loadTaskCards({
  context,
  input,
  statusIds,
  statuses,
}: LoadTaskCardsInput): Promise<LoadedTaskCard[]> {
  if (!canView({ context, feature: "task" }) || input.entityTypeId) return [];
  const { assigneeId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "TASK", assigneeId });
  const rows = await context.db.task.findMany({
    where: { ...ids, orderId: null, doneAt: null, statusId: { in: statusIds } },
    select: {
      ...{ id: true, statusId: true, customerId: true, dueAt: true, doneAt: true },
      entityType: { select: { name: true } },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    take: CARD_LIMIT,
  });
  if (rows.length === 0) return [];
  const [owners, rules] = await Promise.all([
    mainAssigneesOf({ context, ids: rows.map((row) => row.id) }),
    loadFlowRules({ context }),
  ]);
  const byId = new Map(statuses.map((row) => [row.id, row]));
  const now = nowOf({ context });
  return rows.flatMap((row) => {
    if (!row.statusId) return [];
    const assigneeId = owners.get(row.id) ?? null;
    const from = byId.get(row.statusId) ?? null;
    return [
      {
        ...{ kind: "task" as const, id: row.id, statusId: row.statusId },
        ...{ typeName: row.entityType.name, customerId: row.customerId, dueAt: row.dueAt },
        ...{ overdue: isOverdue({ task: row, now }), assigneeId },
        allowedStatusIds: taskTargets({ rules, statuses, from, assigneeId }),
      },
    ];
  });
}
