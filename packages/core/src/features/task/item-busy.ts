import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import type { TaskWarning } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

/** What the busy check needs of a task: a meeting with an item has a span to compare. */
export type BusyProbe = {
  id: string;
  itemId: string | null;
  startsAt: Date;
  endsAt: Date | null;
};

type Window = { itemId: string; startsAt: Date; endsAt: Date };

const windowOf = ({ task }: { task: BusyProbe }): Window | null =>
  task.itemId && task.endsAt
    ? { itemId: task.itemId, startsAt: task.startsAt, endsAt: task.endsAt }
    : null;

/**
 * `ITEM_BUSY` per task (ADR 0117): a meeting whose item has an active hard hold, buffer or block
 * overlapping `[startsAt, endsAt)`. Soft holds never count, a deadline never warns. One query for
 * all tasks (their items over the span of every window); needs `item:read`, else none.
 */
export async function itemBusyWarnings({
  context,
  tasks,
}: {
  context: Context;
  tasks: readonly BusyProbe[];
}): Promise<Map<string, TaskWarning[]>> {
  const windows = tasks.flatMap((task) => {
    const window = windowOf({ task });
    return window ? [[task.id, window] as const] : [];
  });
  if (windows.length === 0 || !canView({ context, feature: "item" })) return new Map();
  const starts = windows.map(([, w]) => w.startsAt.getTime());
  const ends = windows.map(([, w]) => w.endsAt.getTime());
  const rows = await context.db.occupancy.findMany({
    where: {
      itemId: { in: [...new Set(windows.map(([, w]) => w.itemId))] },
      startsAt: { lt: new Date(Math.max(...ends)) },
      endsAt: { gt: new Date(Math.min(...starts)) },
      OR: [{ holdKind: null }, { holdKind: { not: "SOFT" } }],
    },
    select: { itemId: true, startsAt: true, endsAt: true },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  const warnings = new Map<string, TaskWarning[]>();
  for (const [taskId, window] of windows) {
    const hit = rows.find(
      (row) =>
        row.itemId === window.itemId &&
        row.startsAt < window.endsAt &&
        row.endsAt > window.startsAt,
    );
    if (hit) warnings.set(taskId, [{ kind: "ITEM_BUSY", ...hit }]);
  }
  return warnings;
}
