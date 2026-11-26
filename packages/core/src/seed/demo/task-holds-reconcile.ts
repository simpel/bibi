import { defineReconciliation, type ReconcileContext } from "./reconcile";

/** One task room's hold, as derived or as stored. */
type TaskHoldRow = {
  taskItemId: string;
  type: string;
  itemId: string;
  holdKind: string | null;
  startsAt: Date;
  endsAt: Date;
};

const describeRow = ({ type, itemId, holdKind, startsAt, endsAt }: TaskHoldRow) =>
  `${type} ${itemId} ${holdKind ?? "-"} ${startsAt.toISOString()}-${endsAt.toISOString()}`;

/**
 * What the tasks say should be held (ADR 0120): every prebooked (`SOFT`) or booked (`HARD`) room
 * of an active, open task, for the room's own window. Unlike line holds, ended ones count too:
 * nothing freezes them.
 */
async function rebuildTaskHolds({ context }: ReconcileContext): Promise<TaskHoldRow[]> {
  const items = await context.db.taskItem.findMany({
    where: { hold: { not: "RELATED" }, task: { status: "ACTIVE", doneAt: null } },
    select: { id: true, itemId: true, hold: true, startsAt: true, endsAt: true },
  });
  return items.flatMap(({ id, itemId, hold, startsAt, endsAt }) =>
    startsAt && endsAt
      ? [
          {
            taskItemId: id,
            type: "HOLD",
            itemId,
            startsAt,
            endsAt,
            holdKind: hold === "BOOK" ? "HARD" : "SOFT",
          },
        ]
      : [],
  );
}

/** The stored active task holds (`Occupancy` with a `taskItemId`). */
async function storedTaskHolds({ context }: ReconcileContext): Promise<TaskHoldRow[]> {
  const rows = await context.db.occupancy.findMany({
    where: { taskItemId: { not: null } },
    select: {
      taskItemId: true,
      type: true,
      itemId: true,
      holdKind: true,
      startsAt: true,
      endsAt: true,
    },
  });
  return rows.flatMap(({ taskItemId, ...row }) => (taskItemId ? [{ ...row, taskItemId }] : []));
}

/** Task holds (`Occupancy` with a `taskItemId`, written by `syncTaskHolds`) against the tasks. */
export const taskHoldsReconciliation = defineReconciliation({
  name: "task-holds",
  rebuild: rebuildTaskHolds,
  compare: async ({ context, rebuilt }) => {
    const stored = await storedTaskHolds({ context });
    const byKey = new Map(stored.map((row) => [row.taskItemId, row]));
    const differing: string[] = [];
    for (const want of rebuilt) {
      const have = byKey.get(want.taskItemId);
      byKey.delete(want.taskItemId);
      if (!have) differing.push(`task room ${want.taskItemId} lacks ${describeRow(want)}`);
      else if (describeRow(have) !== describeRow(want))
        differing.push(
          `task room ${want.taskItemId} has ${describeRow(have)}, expected ${describeRow(want)}`,
        );
    }
    for (const row of byKey.values())
      differing.push(`task room ${row.taskItemId} should not have ${describeRow(row)}`);
    return differing;
  },
});
