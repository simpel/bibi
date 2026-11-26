import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";
import type { WantedHold } from "./sync-task-holds";

const day = ({ at }: { at: Date }) => at.toISOString().slice(0, 10);

/**
 * What a book would collide with (ADR 0044, 0120): an active hard hold or buffer, or a manual
 * block, on the same item in its window, other than the task's own. Names no order, so nothing
 * of another feature leaks. The exclusion constraint stays the guarantee.
 */
export async function holdCollisions({
  context,
  wanted,
}: {
  context: Pick<OperationContext, "db">;
  wanted: readonly WantedHold[];
}): Promise<AppErrorIssue[]> {
  const hard = wanted.filter((hold) => hold.holdKind === "HARD");
  if (hard.length === 0) return [];
  const own = wanted.map((hold) => hold.taskItemId);
  const rows = await context.db.occupancy.findMany({
    where: {
      itemId: { in: hard.map((hold) => hold.itemId) },
      startsAt: { lt: new Date(Math.max(...hard.map((hold) => hold.endsAt.getTime()))) },
      endsAt: { gt: new Date(Math.min(...hard.map((hold) => hold.startsAt.getTime()))) },
      AND: [
        { OR: [{ holdKind: null }, { holdKind: "HARD" }] },
        { OR: [{ taskItemId: null }, { taskItemId: { notIn: own } }] },
      ],
    },
    select: { itemId: true, startsAt: true, endsAt: true },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  return hard.flatMap((hold): AppErrorIssue[] => {
    const hit = rows.find(
      (row) =>
        row.itemId === hold.itemId && row.startsAt < hold.endsAt && row.endsAt > hold.startsAt,
    );
    if (!hit) return [];
    return [
      {
        path: hold.path,
        message: `The room is already booked or blocked on ${day({ at: hit.startsAt })}`,
      },
    ];
  });
}
