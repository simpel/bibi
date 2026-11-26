import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { loadItemState } from "../item-state/load-item-state";
import { holdCollisions } from "../line/hold-collisions";
import { applyLineState } from "../line/line-state";
import { loadLine } from "../line/to-line-record";
import type { TaskRoom } from "./task-room-lines";

export type TaskRoomStatesInput = {
  context: OperationContext;
  orderId: string;
  rooms: readonly TaskRoom[];
};

/**
 * Puts each line made from a task's room (ADR 0120) in the room's hold: a line whose entry state
 * is not the wanted one is moved there by hand (`MANUAL`, `stateOverridden`, as
 * `line.changeState` does), so a status move does not turn a book soft. A line whose entry state
 * already holds as wanted keeps following the status. This places a new line, so the type's
 * transitions do not apply; a hard hold that collides is `CONFLICT`.
 */
export async function applyTaskRoomStates({
  context,
  orderId,
  rooms,
}: TaskRoomStatesInput): Promise<Result<true>> {
  if (rooms.length === 0) return ok({ value: true });
  const rows = await context.db.line.findMany({
    where: { orderId, itemId: { in: rooms.map((room) => room.itemId) } },
    select: { id: true, itemId: true, startsAt: true, endsAt: true, stateId: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const used = new Set<string>();
  for (const room of rooms) {
    const row = rows.find(
      (one) =>
        !used.has(one.id) &&
        one.itemId === room.itemId &&
        one.startsAt?.getTime() === room.startsAt.getTime() &&
        one.endsAt?.getTime() === room.endsAt.getTime(),
    );
    if (!row) continue;
    used.add(row.id);
    if (row.stateId === room.stateId) continue;
    const [line, to] = await Promise.all([
      loadLine({ context, id: row.id }),
      loadItemState({ context, id: room.stateId }),
    ]);
    if (!line || !to) continue;
    const issues = await holdCollisions({ context, line, to });
    if (issues.length > 0) return conflict({ message: issues[0]?.message ?? "Blocked", issues });
    const moved = await applyLineState({
      ...{ context, before: line, stateId: room.stateId },
      ...{ trigger: "MANUAL", overridden: true },
    });
    if (!moved.ok) return moved;
  }
  return ok({ value: true });
}
