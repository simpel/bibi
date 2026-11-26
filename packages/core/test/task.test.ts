import { describe, expect, it } from "vitest";
import {
  archiveTask,
  completeTask,
  createTask,
  execute,
  getTask,
  linkTaskOrder,
  listTasks,
  reopenTask,
  type TaskUpdateInput,
  updateTask,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestOrder } from "./order-helpers";
import { addTask, inHours, taskSetup } from "./task-helpers";

describe("tasks (ADR 0117, 0120)", () => {
  it("creates a task assigned to the caller, and one with only its type", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup, note: "Show Atrium" }) });
    expect(task).toMatchObject({
      type: { id: setup.meeting.id, name: "Site visit" },
      orderId: null,
      items: [],
      doneAt: null,
      overdue: false,
      assigneeId: context.actor.userId,
      note: "Show Atrium",
    });
    const bare = unwrap({
      result: await execute({
        operation: createTask,
        input: { entityTypeId: setup.deadline.id },
        context,
      }),
    });
    expect(bare).toMatchObject({
      customerId: null,
      contactId: null,
      orderId: null,
      dueAt: null,
      overdue: false,
    });
    const switched = await execute({
      operation: updateTask,
      input: { id: task.id, entityTypeId: setup.deadline.id, dueAt: null },
      context,
    });
    expect(unwrap({ result: switched })).toMatchObject({
      type: { id: setup.deadline.id },
      dueAt: null,
    });
  });

  it("needs a customer for a contact or an order, and clears them together", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const create = ({ input }: { input: Record<string, unknown> }) =>
      execute({
        operation: createTask,
        input: { entityTypeId: setup.meeting.id, ...input },
        context,
      });
    const contactOnly = await create({ input: { contactId: setup.contact.id } });
    expect(contactOnly).toMatchObject({ ok: false, error: { issues: [{ path: "contactId" }] } });
    const customerOnly = unwrap({
      result: await create({ input: { customerId: setup.customer.id } }),
    });
    expect(customerOnly).toMatchObject({ customerId: setup.customer.id, contactId: null });
    const task = unwrap({ result: await addTask({ context, setup }) });
    const update = ({ ...input }: Omit<TaskUpdateInput, "id">) =>
      execute({ operation: updateTask, input: { id: task.id, ...input }, context });
    const keptContact = await update({ customerId: null });
    expect(keptContact).toMatchObject({ ok: false, error: { issues: [{ path: "contactId" }] } });
    const cleared = unwrap({ result: await update({ customerId: null, contactId: null }) });
    expect([cleared.customerId, cleared.contactId]).toEqual([null, null]);
    const again = { customerId: setup.customer.id, contactId: setup.contact.id };
    expect(unwrap({ result: await update(again) }).customerId).toBe(setup.customer.id);
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

  it("changes and unlinks the order, and moves the task to another customer", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const make = ({ customerId, contactId }: { customerId: string; contactId: string }) =>
      createTestOrder({ ...{ context, entityTypeId: setup.type.id, customerId }, contactId });
    const first = await make({ customerId: setup.customer.id, contactId: setup.contact.id });
    const second = await make({ customerId: setup.customer.id, contactId: setup.contact.id });
    const foreign = await make({ customerId: setup.other.id, contactId: setup.otherContact.id });
    const task = unwrap({ result: await addTask({ context, setup, orderId: first.id }) });
    const update = ({ ...input }: Omit<TaskUpdateInput, "id">) =>
      execute({ operation: updateTask, input: { id: task.id, ...input }, context });
    expect(unwrap({ result: await update({ orderId: second.id }) }).orderId).toBe(second.id);
    expect(errorCode({ result: await update({ orderId: foreign.id }) })).toBe("VALIDATION");
    expect(unwrap({ result: await update({ orderId: null }) }).orderId).toBeNull();
    unwrap({ result: await update({ orderId: first.id }) });
    // The order must follow the customer: moving alone is refused, with the order unlinked it works.
    const moveOnly = { customerId: setup.other.id, contactId: setup.otherContact.id };
    expect(errorCode({ result: await update(moveOnly) })).toBe("VALIDATION");
    const moved = unwrap({ result: await update({ ...moveOnly, orderId: null }) });
    expect([moved.customerId, moved.contactId, moved.orderId]).toEqual([
      setup.other.id,
      setup.otherContact.id,
      null,
    ]);
    expect(errorCode({ result: await update({ customerId: setup.customer.id }) })).toBe(
      "VALIDATION",
    );
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
    const past = { dueAt: inHours({ hours: -2 }) };
    const task = unwrap({ result: await addTask({ context, setup, ...past }) });
    expect(task.overdue).toBe(true);
    const input = { id: task.id };
    const done = unwrap({ result: await execute({ operation: completeTask, input, context }) });
    expect(done).toMatchObject({ doneById: context.actor.userId, overdue: false });
    expect(done.doneAt).toBeInstanceOf(Date);
    const open = unwrap({ result: await execute({ operation: reopenTask, input, context }) });
    expect(open).toMatchObject({ doneAt: null, doneById: null, overdue: true });
  });

  it("lists by filter and state, and archiving hides a task", async () => {
    const setup = await taskSetup();
    const { context, anna } = setup;
    const past = { dueAt: inHours({ hours: -2 }) };
    const late = unwrap({ result: await addTask({ context, setup, ...past }) });
    const soon = unwrap({ result: await addTask({ context, setup, assigneeId: anna }) });
    const undated = unwrap({ result: await addTask({ context, setup, dueAt: undefined }) });
    const list = async ({ input }: { input: Record<string, unknown> }) =>
      unwrap({
        result: await execute({ operation: listTasks, input: { page: 1, ...input }, context }),
      });
    // By due time, a task without one last; it never appears in a window.
    expect((await list({ input: {} })).items.map((t) => t.id)).toEqual([
      late.id,
      soon.id,
      undated.id,
    ]);
    expect((await list({ input: { state: "overdue" } })).items.map((t) => t.id)).toEqual([late.id]);
    expect((await list({ input: { assigneeId: anna } })).items.map((t) => t.id)).toEqual([soon.id]);
    expect((await list({ input: { from: inHours({ hours: 0 }) } })).total).toBe(1);
    expect((await list({ input: { customerId: setup.other.id } })).total).toBe(0);
    const input = { id: soon.id };
    unwrap({ result: await execute({ operation: archiveTask, input, context }) });
    expect((await list({ input: {} })).items.map((t) => t.id)).toEqual([late.id, undated.id]);
    const gone = await execute({ operation: getTask, input, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });
});
