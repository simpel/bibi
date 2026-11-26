import { describe, expect, it } from "vitest";
import {
  archiveItem,
  archiveTask,
  calendarRange,
  completeTask,
  createEntityType,
  createOccupancy,
  createTask,
  deleteItem,
  execute,
  reopenTask,
  restoreTask,
  type TaskItemInput,
  updateTask,
} from "../src/index";
import { reconcileProjections } from "../src/seed/demo/reconcile-checks";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { hours } from "./occupancy-helpers";
import { taskSetup } from "./task-helpers";

type Setup = Awaited<ReturnType<typeof taskSetup>>;

const prebook = ({ itemId }: { itemId: string }): TaskItemInput => ({
  itemId,
  hold: "PREBOOK",
  ...hours({ from: 8, to: 17 }),
});
const book = ({ itemId }: { itemId: string }): TaskItemInput => ({
  itemId,
  hold: "BOOK",
  ...hours({ from: 9, to: 12 }),
});

const withItems = ({ setup, items }: { setup: Setup; items: TaskItemInput[] }) =>
  execute({
    operation: createTask,
    input: { entityTypeId: setup.meeting.id, items },
    context: setup.context,
  });

/** The active holds of the item: kind and whose (task room or not). */
async function holdsOn({ setup, itemId }: { setup: Setup; itemId: string }) {
  const rows = await setup.context.db.occupancy.findMany({
    where: { itemId },
    select: { holdKind: true, taskItemId: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({ kind: row.holdKind, task: row.taskItemId !== null }));
}

describe("a task's rooms and their holds (ADR 0120)", () => {
  it("validates rooms: bookable, once, a window exactly when held", async () => {
    const setup = await taskSetup();
    const { context, room } = setup;
    const stockType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Dish" },
        context,
      }),
    });
    const dish = await createTestItem({ context, entityTypeId: stockType.id, name: "Soup" });
    const refused = ({ items }: { items: TaskItemInput[] }) => withItems({ setup, items });
    expect(await refused({ items: [{ itemId: dish.id, hold: "RELATED" }] })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", issues: [{ path: "items.0.itemId" }] },
    });
    expect(await refused({ items: [{ itemId: room.id, hold: "BOOK" }] })).toMatchObject({
      error: { issues: [{ path: "items.0.startsAt" }] },
    });
    expect(
      await refused({
        items: [{ itemId: room.id, hold: "RELATED", ...hours({ from: 8, to: 9 }) }],
      }),
    ).toMatchObject({ error: { issues: [{ path: "items.0.startsAt" }] } });
    expect(
      await refused({
        items: [{ itemId: room.id, hold: "PREBOOK", ...hours({ from: 9, to: 8 }) }],
      }),
    ).toMatchObject({ error: { issues: [{ path: "items.0.endsAt" }] } });
    expect(
      await refused({
        items: [
          { itemId: room.id, hold: "RELATED" },
          { itemId: room.id, hold: "RELATED" },
        ],
      }),
    ).toMatchObject({ error: { issues: [{ path: "items.1.itemId" }] } });
    const related = unwrap({
      result: await withItems({ setup, items: [{ itemId: room.id, hold: "RELATED" }] }),
    });
    expect(related.items).toMatchObject([
      { itemId: room.id, hold: "RELATED", startsAt: null, endsAt: null },
    ]);
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([]);
  });

  it("prebooks may overlap; a book that collides is CONFLICT at its room", async () => {
    const setup = await taskSetup();
    const { context, room } = setup;
    unwrap({ result: await withItems({ setup, items: [prebook({ itemId: room.id })] }) });
    unwrap({ result: await withItems({ setup, items: [prebook({ itemId: room.id })] }) });
    const booked = unwrap({
      result: await withItems({ setup, items: [book({ itemId: room.id })] }),
    });
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([
      { kind: "SOFT", task: true },
      { kind: "SOFT", task: true },
      { kind: "HARD", task: true },
    ]);
    const other = await createTestItem({ context, entityTypeId: room.entityTypeId, name: "Hönö" });
    const twice = await withItems({
      setup,
      items: [{ itemId: other.id, hold: "RELATED" }, book({ itemId: room.id })],
    });
    expect(twice).toMatchObject({
      ok: false,
      error: { code: "CONFLICT", issues: [{ path: "items.1" }] },
    });
    const block = { itemId: other.id, type: "MAINTENANCE" as const, ...hours({ from: 9, to: 10 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const moved = await execute({
      operation: updateTask,
      input: { id: booked.id, items: [book({ itemId: other.id })] },
      context,
    });
    expect(errorCode({ result: moved })).toBe("CONFLICT");
    // The book itself moves within its room: its own hold never blocks it.
    const later = { ...book({ itemId: room.id }), ...hours({ from: 10, to: 13 }) };
    const kept = unwrap({
      result: await execute({
        operation: updateTask,
        input: { id: booked.id, items: [later] },
        context,
      }),
    });
    expect(kept.items[0]?.id).toBe(booked.items[0]?.id);
    expect(await reconcileProjections({ context })).toEqual([]);
  });

  it("done releases holds for good; archive releases them until restored", async () => {
    const setup = await taskSetup();
    const { context, room } = setup;
    const task = unwrap({ result: await withItems({ setup, items: [book({ itemId: room.id })] }) });
    const input = { id: task.id };
    const done = unwrap({ result: await execute({ operation: completeTask, input, context }) });
    expect(done.items).toMatchObject([{ hold: "RELATED", startsAt: null, endsAt: null }]);
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([]);
    unwrap({ result: await execute({ operation: reopenTask, input, context }) });
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([]);
    const held = unwrap({
      result: await execute({
        operation: updateTask,
        input: { id: task.id, items: [book({ itemId: room.id })] },
        context,
      }),
    });
    expect(held.items[0]?.hold).toBe("BOOK");
    unwrap({ result: await execute({ operation: archiveTask, input, context }) });
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([]);
    unwrap({ result: await execute({ operation: restoreTask, input, context }) });
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([{ kind: "HARD", task: true }]);
    expect(await reconcileProjections({ context })).toEqual([]);
  });

  it("shows a held room on the calendar and refuses deleting the room", async () => {
    const setup = await taskSetup();
    const { context, room } = setup;
    const task = unwrap({ result: await withItems({ setup, items: [book({ itemId: room.id })] }) });
    const span = { from: "2037-11-01", to: "2037-11-01" };
    const calendar = unwrap({
      result: await execute({ operation: calendarRange, input: span, context }),
    });
    expect(calendar.blocks).toMatchObject([
      { itemId: room.id, type: "HOLD", soft: false, taskId: task.id, lineId: null },
    ]);
    const updated = { id: task.id, items: [] };
    unwrap({ result: await execute({ operation: updateTask, input: updated, context }) });
    expect(await holdsOn({ setup, itemId: room.id })).toEqual([]);
    unwrap({
      result: await execute({
        operation: updateTask,
        input: { id: task.id, items: [{ itemId: room.id, hold: "RELATED" }] },
        context,
      }),
    });
    unwrap({ result: await execute({ operation: archiveItem, input: { id: room.id }, context }) });
    const removed = await execute({ operation: deleteItem, input: { id: room.id }, context });
    expect(errorCode({ result: removed })).toBe("CONFLICT");
  });
});
