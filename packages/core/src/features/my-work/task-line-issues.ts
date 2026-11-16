import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { savedLineIssues } from "../line/saved-line-issues";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import { withEffective } from "../line/with-effective";
import type { LineIssueKind } from "../order/plan/issue-schema";
import type { RawTask } from "./task-sources";
import type { TaskWindow } from "./task-window";

type Context = Pick<OperationContext, "db" | "permissions">;

/** At most this many orders are checked per read, soonest first: the checks are heavy. */
const MAX_ORDERS = 40;

/** Issues that ask nothing of the member: another soft hold is allowed (ADR 0044). */
const QUIET: ReadonlySet<LineIssueKind> = new Set(["SOFT_OVERLAP"]);

type OrderIssuesInput = { context: Context; orderId: string; window: TaskWindow };

/** One order's lines still to come before the end of next week, with their issues as tasks. */
async function orderIssues({ context, orderId, window }: OrderIssuesInput): Promise<RawTask[]> {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { statusId: true },
  });
  if (!order) return [];
  const rows = await context.db.line.findMany({
    where: { orderId, status: "ACTIVE" },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: LINE_INCLUDE,
  });
  const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
  const found = await savedLineIssues({
    ...{ context, statusId: order.statusId, lines },
    withAvailability: canView({ context, feature: "item" }),
  });
  const byId = new Map(lines.map((line) => [line.id, line]));
  return found.flatMap(({ lineId, name, issues }) => {
    const line = byId.get(lineId);
    if (!line?.startsAt || !line.endsAt) return [];
    if (line.endsAt <= window.now || line.startsAt >= window.end) return [];
    const kinds = [...new Set(issues.map((issue) => issue.kind))].filter((k) => !QUIET.has(k));
    const base = { orderId, dueAt: line.startsAt, lineId, lineName: name };
    return kinds.map((kind) =>
      kind === "HARD_CLASH"
        ? {
            ...base,
            kind: "HARD_CLASH" as const,
            otherReference: issues.find((issue) => issue.kind === kind)?.orderReference ?? null,
          }
        : { ...base, kind: "LINE_ISSUE" as const, issueKind: kind, id: `${lineId}:${kind}` },
    );
  });
}

export type LineIssueTasksInput = {
  context: Context;
  /** The member's own orders with lines still to come, soonest first. */
  orderIds: string[];
  window: TaskWindow;
};

/**
 * Double bookings and the other planning checks (ADR 0081) on the member's own orders, as tasks:
 * HARD_CLASH (Blocked) and LINE_ISSUE. Needs `program:read`, like `line.issues`; availability
 * (clashes, capacity, pools, hours) needs `item:read`.
 */
export async function lineIssueTasks({
  context,
  orderIds,
  window,
}: LineIssueTasksInput): Promise<RawTask[]> {
  if (!canView({ context, feature: "program" })) return [];
  const checked = orderIds.slice(0, MAX_ORDERS);
  const found = await Promise.all(
    checked.map((orderId) => orderIssues({ context, orderId, window })),
  );
  return found.flat();
}
