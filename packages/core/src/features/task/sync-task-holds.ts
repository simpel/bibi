import { EITHER_STATUS } from "../../archive/lifecycle-kind";
import { fromUnknown } from "../../errors/from-unknown";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { holdCollisions } from "./task-hold-collisions";
import { TASK_ITEM_ORDER } from "./to-task-dto";

type Context = Pick<OperationContext, "db" | "organizationId">;

/** One hold a task room should have: its own window, soft for a prebook, hard for a book. */
export type WantedHold = {
  taskItemId: string;
  itemId: string;
  holdKind: "SOFT" | "HARD";
  startsAt: Date;
  endsAt: Date;
  path: string;
};

export type SyncTaskHoldsInput = {
  context: Context;
  taskId: string;
  /** The input path of a room in a CONFLICT; default `items.<index>` in the task's own order. */
  pathOf?: (input: { itemId: string; index: number }) => string;
};

type StoredHold = Pick<WantedHold, "itemId" | "startsAt" | "endsAt"> & { holdKind: string | null };

/** The stored row already is the wanted hold. */
const same = ({ row, want }: { row: StoredHold; want: WantedHold }) =>
  row.itemId === want.itemId &&
  row.holdKind === want.holdKind &&
  row.startsAt.getTime() === want.startsAt.getTime() &&
  row.endsAt.getTime() === want.endsAt.getTime();

/** The holds the task's state asks for (ADR 0120): only while it is active and open. */
async function wantedHolds({ context, taskId, pathOf }: SyncTaskHoldsInput) {
  const task = await context.db.task.findFirst({
    where: { id: taskId, status: EITHER_STATUS },
    select: { status: true, doneAt: true, items: { orderBy: TASK_ITEM_ORDER } },
  });
  if (task?.status !== "ACTIVE" || task.doneAt !== null) return [];
  return task.items.flatMap((item, index): WantedHold[] => {
    const { startsAt, endsAt } = item;
    if (item.hold === "RELATED" || !startsAt || !endsAt) return [];
    const path = pathOf ? pathOf({ itemId: item.itemId, index }) : `items.${index}`;
    const holdKind = item.hold === "BOOK" ? "HARD" : "SOFT";
    return [{ taskItemId: item.id, itemId: item.itemId, holdKind, startsAt, endsAt, path }];
  });
}

/** Writes one wanted hold: reactivates or moves the room's row, else creates it. */
async function writeHold({
  context,
  hold,
  rowId,
}: {
  context: Context;
  hold: WantedHold;
  rowId: string | undefined;
}) {
  const { taskItemId: _id, path: _path, ...data } = hold;
  if (rowId) {
    await context.db.occupancy.update({
      where: { id: rowId, status: EITHER_STATUS },
      data: { ...data, status: "ACTIVE" },
    });
    return;
  }
  await context.db.occupancy.create({
    data: {
      ...data,
      type: "HOLD",
      taskItemId: hold.taskItemId,
      organizationId: context.organizationId,
    },
  });
}

/**
 * The one writer of task holds (ADR 0120): `Occupancy` `HOLD` rows with `taskItemId`, derived from
 * the task (active and open) and its prebooked (`SOFT`) and booked (`HARD`) rooms, each for the
 * room's own window. Idempotent: rows no longer wanted are archived first, then each wanted row is
 * reactivated or written. A book that collides is `CONFLICT` with one issue per room; the
 * exclusion constraint's overlap (a race) is mapped the same way. Call it after any change to a
 * task's rooms, done state or status. Checked by the `task-holds` reconciliation.
 */
export async function syncTaskHolds({
  context,
  taskId,
  pathOf,
}: SyncTaskHoldsInput): Promise<Result<true>> {
  const wanted = await wantedHolds({ context, taskId, pathOf });
  const rows = await context.db.occupancy.findMany({
    where: { taskItem: { taskId }, status: EITHER_STATUS },
    select: {
      id: true,
      taskItemId: true,
      itemId: true,
      holdKind: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });
  const rowOf = new Map(rows.map((row) => [row.taskItemId, row]));
  const stale = rows.filter((row) => {
    const want = wanted.find((hold) => hold.taskItemId === row.taskItemId);
    return row.status === "ACTIVE" && !(want && same({ row, want }));
  });
  if (stale.length > 0) {
    await context.db.occupancy.updateMany({
      where: { id: { in: stale.map((row) => row.id) } },
      data: { status: "ARCHIVED" },
    });
  }
  const changed = wanted.filter((hold) => {
    const row = rowOf.get(hold.taskItemId);
    return row?.status !== "ACTIVE" || stale.some((one) => one.id === row.id);
  });
  const issues = await holdCollisions({ context, wanted: changed });
  if (issues.length > 0) return conflict({ message: issues[0]?.message ?? "Booked", issues });
  for (const hold of changed) {
    try {
      await writeHold({ context, hold, rowId: rowOf.get(hold.taskItemId)?.id });
    } catch (error) {
      // The transaction is aborted by now: the caller returns this, so everything rolls back.
      if (fromUnknown({ error }).code !== "CONFLICT") throw error;
      const message = "The room is already booked or blocked in its window";
      return conflict({ message, issues: [{ path: hold.path, message }] });
    }
  }
  return ok({ value: true });
}
