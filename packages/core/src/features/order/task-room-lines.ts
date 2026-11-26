import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { TASK_ITEM_ORDER } from "../task/to-task-dto";
import type { CreateDraftLine } from "./draft-line-schema";
import { checkReadable } from "./order-rules";

type Context = Pick<OperationContext, "db" | "permissions">;

/** A task's prebooked or booked room that becomes a line of the new order (ADR 0120). */
export type TaskRoom = {
  itemId: string;
  startsAt: Date;
  endsAt: Date;
  /** The item type's first state of the room's hold kind (position, then id). */
  stateId: string;
};

export type TaskRoomLines = { rooms: TaskRoom[]; lines: CreateDraftLine[] };

const KIND = { PREBOOK: "SOFT", BOOK: "HARD" } as const;
const KIND_NAME = { SOFT: "soft-hold (prebook)", HARD: "hard-hold (book)" } as const;

/** The held rooms of the tasks that no input line takes, in task then room order. */
async function heldRooms({ context, taskIds }: { context: Context; taskIds: readonly string[] }) {
  const rows = await context.db.taskItem.findMany({
    where: { taskId: { in: [...taskIds] }, hold: { not: "RELATED" }, task: { doneAt: null } },
    select: {
      ...{ taskId: true, itemId: true, hold: true, startsAt: true, endsAt: true },
      item: { select: { name: true, entityTypeId: true } },
    },
    orderBy: TASK_ITEM_ORDER,
  });
  const rank = new Map(taskIds.map((id, index) => [id, index]));
  return rows.sort((a, b) => (rank.get(a.taskId) ?? 0) - (rank.get(b.taskId) ?? 0));
}

/**
 * The line type the order intake gives a new line by default: the organization's first line
 * type by name (as `entityType.list` lists them), so a converted room looks like one added by hand.
 */
const defaultLineType = ({ context }: { context: Context }) =>
  context.db.entityType.findFirst({
    where: { base: "LINE" },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true },
  });

/**
 * Create order from a task (ADR 0120 decision 5): each prebooked or booked room of the linked
 * tasks that no input line takes becomes a draft line for that item with the room's own window,
 * and the state its line must end in (the item type's first soft or hard state that is not
 * released). An item type without such a state, or no line type, is `VALIDATION` at
 * `taskIds.<i>`; creating lines needs `program:write`.
 */
export async function taskRoomLines({
  context,
  taskIds,
  takenItemIds,
}: {
  context: Context;
  taskIds: readonly string[];
  takenItemIds: readonly string[];
}): Promise<Result<TaskRoomLines>> {
  if (taskIds.length === 0) return ok({ value: { rooms: [], lines: [] } });
  const held = (await heldRooms({ context, taskIds })).filter(
    (room) => !takenItemIds.includes(room.itemId) && room.startsAt && room.endsAt,
  );
  if (held.length === 0) return ok({ value: { rooms: [], lines: [] } });
  const allowed = checkReadable({ context, permission: "program:write", path: "taskIds" });
  if (!allowed.ok) return allowed;
  const [lineType, states] = await Promise.all([
    defaultLineType({ context }),
    context.db.itemState.findMany({
      where: {
        entityTypeId: { in: held.map((room) => room.item.entityTypeId) },
        hold: { in: ["SOFT", "HARD"] },
        released: false,
      },
      select: { id: true, entityTypeId: true, hold: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
  ]);
  const rooms: TaskRoom[] = [];
  const lines: CreateDraftLine[] = [];
  for (const room of held) {
    const path = `taskIds.${taskIds.indexOf(room.taskId)}`;
    if (!lineType) {
      const message = "No line type to carry the task's rooms over";
      return invalid({ message, issues: [{ path, message }] });
    }
    const kind = KIND[room.hold as keyof typeof KIND];
    const state = states.find((s) => s.entityTypeId === room.item.entityTypeId && s.hold === kind);
    const { startsAt, endsAt } = room;
    if (!state || !startsAt || !endsAt) {
      const message = `"${room.item.name}" has no ${KIND_NAME[kind]} state to carry it over`;
      return invalid({ message, issues: [{ path, message }] });
    }
    rooms.push({ itemId: room.itemId, startsAt, endsAt, stateId: state.id });
    const line = { entityTypeId: lineType.id, name: room.item.name, itemId: room.itemId };
    lines.push({ ...line, startsAt, endsAt });
  }
  return ok({ value: { rooms, lines } });
}
