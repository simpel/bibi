import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { TaskItemInput } from "./task-item-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** A held room's CONFLICT points at its place in the input (`items.<index>`). */
export const inputPath =
  ({ items }: { items: readonly TaskItemInput[] }) =>
  ({ itemId }: { itemId: string }) =>
    `items.${items.findIndex((item) => item.itemId === itemId)}`;

/** A room's window as stored: null for a related room (ADR 0120, check constraint). */
const windowOf = ({ item }: { item: TaskItemInput }) =>
  item.hold === "RELATED"
    ? { startsAt: null, endsAt: null }
    : { startsAt: item.startsAt ?? null, endsAt: item.endsAt ?? null };

/** Each room once; a prebook or book has a window, a related room none. */
function shapeIssues({ items }: { items: readonly TaskItemInput[] }): AppErrorIssue[] {
  const seen = new Set<string>();
  return items.flatMap((item, index): AppErrorIssue[] => {
    const path = `items.${index}`;
    if (seen.has(item.itemId)) return [{ path: `${path}.itemId`, message: "Listed twice" }];
    seen.add(item.itemId);
    if (item.hold === "RELATED") {
      return item.startsAt || item.endsAt
        ? [{ path: `${path}.startsAt`, message: "A related room has no window" }]
        : [];
    }
    if (!item.startsAt || !item.endsAt) {
      return [{ path: `${path}.startsAt`, message: "A prebook or book needs a start and an end" }];
    }
    return item.endsAt > item.startsAt
      ? []
      : [{ path: `${path}.endsAt`, message: "The end must be after the start" }];
  });
}

/**
 * The rooms of `task.create` and `task.update` (ADR 0120): each listed once, an active item of a
 * `BOOKABLE` type (never stock), with a window exactly when it is held. `VALIDATION` at
 * `items.<index>`. The caller checks `item:read` first (`checkTaskAccess`).
 */
export async function checkTaskItems({
  context,
  items,
}: Db & { items: readonly TaskItemInput[] | undefined }): Promise<Result<true>> {
  if (!items || items.length === 0) return ok({ value: true });
  const shaped = shapeIssues({ items });
  const found = await context.db.item.findMany({
    where: {
      id: { in: items.map((item) => item.itemId) },
      entityType: { capabilities: { has: "BOOKABLE" } },
    },
    select: { id: true },
  });
  const known = new Set(found.map((item) => item.id));
  const unknown = items.flatMap((item, index) =>
    known.has(item.itemId)
      ? []
      : [{ path: `items.${index}.itemId`, message: "Unknown bookable item" }],
  );
  const issues = [...unknown, ...shaped];
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: issues[0]?.message ?? "Invalid rooms", issues });
}

/**
 * Replaces the task's rooms with `items` (ADR 0120), keyed by item: a room kept keeps its row id
 * (and its hold row), a room dropped is deleted (its hold goes by cascade). Holds follow only
 * through `syncTaskHolds`, which the caller runs next.
 */
export async function writeTaskItems({
  context,
  taskId,
  items,
}: {
  context: Pick<OperationContext, "db" | "organizationId">;
  taskId: string;
  items: readonly TaskItemInput[];
}) {
  const existing = await context.db.taskItem.findMany({ where: { taskId } });
  const wanted = new Set(items.map((item) => item.itemId));
  const dropped = existing.filter((row) => !wanted.has(row.itemId)).map((row) => row.id);
  if (dropped.length > 0) await context.db.taskItem.deleteMany({ where: { id: { in: dropped } } });
  for (const item of items) {
    const data = { hold: item.hold, ...windowOf({ item }) };
    const row = existing.find((one) => one.itemId === item.itemId);
    if (!row) {
      await context.db.taskItem.create({
        data: { ...data, taskId, itemId: item.itemId, organizationId: context.organizationId },
      });
    } else if (
      row.hold !== data.hold ||
      row.startsAt?.getTime() !== data.startsAt?.getTime() ||
      row.endsAt?.getTime() !== data.endsAt?.getTime()
    ) {
      await context.db.taskItem.update({ where: { id: row.id }, data });
    }
  }
}

/**
 * Lets go of the task's holds for good (ADR 0120 decision 5): every prebook and book becomes a
 * related room without a window. Used when the task is marked done and when an order takes over
 * the room; the caller runs `syncTaskHolds` next.
 */
export async function relateTaskItems({
  context,
  taskId,
  itemIds,
}: Db & { taskId: string; itemIds?: readonly string[] }) {
  await context.db.taskItem.updateMany({
    where: {
      taskId,
      hold: { not: "RELATED" },
      ...(itemIds ? { itemId: { in: [...itemIds] } } : {}),
    },
    data: { hold: "RELATED", startsAt: null, endsAt: null },
  });
}
