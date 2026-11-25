import { describe, expect, it } from "vitest";
import {
  archiveTask,
  completeTask,
  createOccupancy,
  execute,
  getTask,
  linkTaskOrder,
  listTasks,
  reopenTask,
  updateEntityType,
  updateTask,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestOrder } from "./order-helpers";
import { addTask, inHours, taskSetup } from "./task-helpers";

describe("tasks around a customer (ADR 0117)", () => {
  it("creates a meeting assigned to the caller and checks the type's shape", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup, note: "Show Atrium" }) });
    expect(task).toMatchObject({
      type: { id: setup.meeting.id, name: "Site visit" },
      shape: "MEETING",
      orderId: null,
      doneAt: null,
      overdue: false,
      warnings: [],
      assigneeId: context.actor.userId,
      note: "Show Atrium",
    });
    const noEnd = await addTask({ context, setup, endsAt: null });
    expect(errorCode({ result: noEnd })).toBe("VALIDATION");
    const backwards = await addTask({ context, setup, endsAt: inHours({ hours: 23 }) });
    expect(errorCode({ result: backwards })).toBe("VALIDATION");
    const deadline = { entityTypeId: setup.deadline.id };
    const withEnd = await addTask({ context, setup, ...deadline });
    expect(errorCode({ result: withEnd })).toBe("VALIDATION");
    const due = unwrap({ result: await addTask({ context, setup, ...deadline, endsAt: null }) });
    expect(due).toMatchObject({ shape: "DEADLINE", endsAt: null });
    const switched = await execute({
      operation: updateTask,
      input: { id: task.id, entityTypeId: setup.deadline.id },
      context,
    });
    expect(errorCode({ result: switched })).toBe("VALIDATION");
    const moved = unwrap({
      result: await execute({
        operation: updateTask,
        input: { id: task.id, entityTypeId: setup.deadline.id, endsAt: null },
        context,
      }),
    });
    expect(moved).toMatchObject({ shape: "DEADLINE", endsAt: null });
  });

  it("refuses a contact at another customer and a type of another base", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const wrong = await addTask({ context, setup, contactId: setup.otherContact.id });
    expect(errorCode({ result: wrong })).toBe("VALIDATION");
    const type = await addTask({ context, setup, entityTypeId: setup.type.id });
    expect(errorCode({ result: type })).toBe("VALIDATION");
    const task = unwrap({ result: await addTask({ context, setup }) });
    const update = { id: task.id, contactId: setup.otherContact.id };
    const changed = await execute({ operation: updateTask, input: update, context });
    expect(errorCode({ result: changed })).toBe("VALIDATION");
  });

  it("refuses a shape change while the type has active tasks", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const input = { id: setup.meeting.id, taskShape: "DEADLINE" as const };
    unwrap({ result: await addTask({ context, setup }) });
    const refused = await execute({ operation: updateEntityType, input, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const shapeless = await execute({
      operation: updateEntityType,
      input: { id: setup.type.id, taskShape: "MEETING" },
      context,
    });
    expect(errorCode({ result: shapeless })).toBe("VALIDATION");
  });

  it("links an order once, of the same customer", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const order = await createTestOrder({
      ...{ context, entityTypeId: setup.type.id, customerId: setup.customer.id },
      contactId: setup.contact.id,
    });
    const foreign = await createTestOrder({
      ...{ context, entityTypeId: setup.type.id, customerId: setup.other.id },
      contactId: setup.otherContact.id,
    });
    const task = unwrap({ result: await addTask({ context, setup }) });
    const link = ({ orderId }: { orderId: string }) =>
      execute({ operation: linkTaskOrder, input: { taskId: task.id, orderId }, context });
    expect(errorCode({ result: await link({ orderId: foreign.id }) })).toBe("VALIDATION");
    expect(unwrap({ result: await link({ orderId: order.id }) }).orderId).toBe(order.id);
    expect(errorCode({ result: await link({ orderId: order.id }) })).toBe("CONFLICT");
    const listed = unwrap({
      result: await execute({ operation: listTasks, input: { orderId: order.id }, context }),
    });
    expect(listed.items.map((item) => item.id)).toEqual([task.id]);
  });

  it("links tasks given to order.create in the same step", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup }) });
    const party = { customerId: setup.customer.id, contactId: setup.contact.id };
    const order = await createTestOrder({
      ...{ context, entityTypeId: setup.type.id, ...party },
      taskIds: [task.id],
    } as Parameters<typeof createTestOrder>[0]);
    const read = unwrap({
      result: await execute({ operation: getTask, input: { id: task.id }, context }),
    });
    expect(read.orderId).toBe(order.id);
    const other = unwrap({
      result: await addTask({
        ...{ context, setup },
        customerId: setup.other.id,
        contactId: setup.otherContact.id,
      }),
    });
    await expect(
      createTestOrder({
        ...{ context, entityTypeId: setup.type.id, ...party },
        taskIds: [other.id],
      } as Parameters<typeof createTestOrder>[0]),
    ).rejects.toMatchObject({ code: "VALIDATION", issues: [{ path: "taskIds.0" }] });
  });

  it("completes and reopens, and an open past task is overdue", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const past = { startsAt: inHours({ hours: -3 }), endsAt: inHours({ hours: -2 }) };
    const task = unwrap({ result: await addTask({ context, setup, ...past }) });
    expect(task.overdue).toBe(true);
    const input = { id: task.id };
    const done = unwrap({ result: await execute({ operation: completeTask, input, context }) });
    expect(done).toMatchObject({ doneById: context.actor.userId, overdue: false });
    expect(done.doneAt).toBeInstanceOf(Date);
    const open = unwrap({ result: await execute({ operation: reopenTask, input, context }) });
    expect(open).toMatchObject({ doneAt: null, doneById: null, overdue: true });
  });

  it("warns when a meeting's item is busy, never for a deadline or outside the span", async () => {
    const setup = await taskSetup();
    const { context, room } = setup;
    const block = {
      ...{ itemId: room.id, type: "MAINTENANCE" as const },
      ...{ startsAt: inHours({ hours: 24 }), endsAt: inHours({ hours: 26 }) },
    };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const busy = unwrap({ result: await addTask({ context, setup, itemId: room.id }) });
    expect(busy.warnings).toMatchObject([{ kind: "ITEM_BUSY", itemId: room.id }]);
    const later = { startsAt: inHours({ hours: 30 }), endsAt: inHours({ hours: 31 }) };
    const free = unwrap({ result: await addTask({ context, setup, itemId: room.id, ...later }) });
    expect(free.warnings).toEqual([]);
    const deadline = unwrap({
      result: await addTask({
        ...{ context, setup, itemId: room.id, endsAt: null },
        entityTypeId: setup.deadline.id,
      }),
    });
    expect(deadline.warnings).toEqual([]);
  });

  it("lists by filter and state, and archiving hides a task", async () => {
    const setup = await taskSetup();
    const { context, anna } = setup;
    const past = { startsAt: inHours({ hours: -3 }), endsAt: inHours({ hours: -2 }) };
    const late = unwrap({ result: await addTask({ context, setup, ...past }) });
    const soon = unwrap({ result: await addTask({ context, setup, assigneeId: anna }) });
    const list = async ({ input }: { input: Record<string, unknown> }) =>
      unwrap({
        result: await execute({ operation: listTasks, input: { page: 1, ...input }, context }),
      });
    expect((await list({ input: {} })).items.map((t) => t.id)).toEqual([late.id, soon.id]);
    expect((await list({ input: { state: "overdue" } })).items.map((t) => t.id)).toEqual([late.id]);
    expect((await list({ input: { assigneeId: anna } })).items.map((t) => t.id)).toEqual([soon.id]);
    expect((await list({ input: { from: inHours({ hours: 0 }) } })).total).toBe(1);
    expect((await list({ input: { customerId: setup.other.id } })).total).toBe(0);
    const input = { id: soon.id };
    unwrap({ result: await execute({ operation: archiveTask, input, context }) });
    expect((await list({ input: {} })).items.map((t) => t.id)).toEqual([late.id]);
    const gone = await execute({ operation: getTask, input, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });
});
