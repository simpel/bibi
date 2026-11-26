import { describe, expect, it } from "vitest";
import {
  changeOrderStatus,
  createEntityType,
  createTask,
  execute,
  getTask,
  type TaskItemInput,
} from "../src/index";
import { reconcileProjections } from "../src/seed/demo/reconcile-checks";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { hours } from "./occupancy-helpers";
import {
  type CreateSetup,
  createSetup,
  createWith,
  linesOf,
  roomLine,
} from "./order-create-helpers";
import { memberUser } from "./order-helpers";
import { statusByName } from "./order-status-helpers";
import { setCell } from "./status-grid-helpers";

/** A site visit for the setup's party holding `items`. */
async function taskWith({ setup, items }: { setup: CreateSetup; items: TaskItemInput[] }) {
  const { context } = setup;
  // As a configured organization: the room type's default "Active" state is archived, so its
  // first soft and hard states are Prebooked and Booked.
  await context.db.itemState.updateMany({
    where: { entityTypeId: setup.room.entityTypeId, name: "Active" },
    data: { status: "ARCHIVED" },
  });
  const visit = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "TASK", name: `Site visit ${items.length}` },
      context,
    }),
  });
  const input = { entityTypeId: visit.id, ...setup.party, items };
  return unwrap({ result: await execute({ operation: createTask, input, context }) });
}

const window = hours({ from: 9, to: 12 });

describe("create order from a task (ADR 0120 decision 5)", () => {
  it("carries prebooked and booked rooms over as lines in the same hold", async () => {
    const setup = await createSetup();
    const { context, room, roomState } = setup;
    const spare = await createTestItem({ context, entityTypeId: room.entityTypeId, name: "Spare" });
    const task = await taskWith({
      setup,
      items: [
        { itemId: room.id, hold: "BOOK", ...window },
        { itemId: spare.id, hold: "PREBOOK", ...window },
      ],
    });
    const assigneeId = await memberUser({ context, name: "Johan Ek" });
    const order = unwrap({
      result: await createWith({ setup, input: { taskIds: [task.id], assigneeId } }),
    });
    const lines = await linesOf({ context, orderId: order.id });
    expect(lines.map((line) => [line.itemId, line.stateId, line.stateOverridden])).toEqual([
      [room.id, roomState.booked.id, true],
      [spare.id, roomState.prebooked.id, false],
    ]);
    expect(lines[0]?.startsAt?.getTime()).toBe(window.startsAt.getTime());
    const read = unwrap({
      result: await execute({ operation: getTask, input: { id: task.id }, context }),
    });
    expect(read.orderId).toBe(order.id);
    expect(read.items.map((item) => item.hold)).toEqual(["RELATED", "RELATED"]);
    const taskHolds = await context.db.occupancy.count({ where: { taskItemId: { not: null } } });
    expect(taskHolds).toBe(0);
    // A status move skips the booked line set by hand: a status that prebooks rooms keeps it booked.
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.prebooked.id };
    unwrap({ result: await setCell({ context, orderStatus: "Confirmed", ...cell }) });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const input = { orderId: order.id, statusId: confirmed.id };
    unwrap({ result: await execute({ operation: changeOrderStatus, input, context }) });
    const after = await linesOf({ context, orderId: order.id });
    expect(after.map((line) => line.stateId)).toEqual([
      roomState.booked.id,
      roomState.prebooked.id,
    ]);
    expect(await reconcileProjections({ context })).toEqual([]);
  });

  it("does not add a room an input line takes", async () => {
    const setup = await createSetup();
    const { context, room } = setup;
    const task = await taskWith({ setup, items: [{ itemId: room.id, hold: "BOOK", ...window }] });
    const input = { lines: [roomLine({ setup, from: 9, to: 12 })], taskIds: [task.id] };
    const order = unwrap({ result: await createWith({ setup, input }) });
    const lines = await linesOf({ context, orderId: order.id });
    expect(lines.map((line) => line.name)).toEqual(["Room 9-12"]);
    const holds = await context.db.occupancy.findMany({
      where: { itemId: room.id, type: "HOLD" },
      select: { lineId: true, taskItemId: true },
    });
    expect(holds).toEqual([{ lineId: lines[0]?.id, taskItemId: null }]);
  });

  it("refuses a room whose type has no state of the hold's kind", async () => {
    const setup = await createSetup();
    const { context, room, roomState } = setup;
    const task = await taskWith({ setup, items: [{ itemId: room.id, hold: "BOOK", ...window }] });
    await context.db.itemState.update({
      where: { id: roomState.booked.id },
      data: { hold: "SOFT" },
    });
    const refused = await createWith({ setup, input: { taskIds: [task.id] } });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    expect(refused).toMatchObject({ error: { issues: [{ path: "taskIds.0" }] } });
    const read = unwrap({
      result: await execute({ operation: getTask, input: { id: task.id }, context }),
    });
    expect(read.items[0]?.hold).toBe("BOOK");
  });
});
