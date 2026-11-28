import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  archiveOrderStatus,
  archiveTask,
  completeTask,
  createOrderStatus,
  type ExecuteContext,
  execute,
  linkTaskOrder,
  listTasks,
  moveTask,
  pipelineBoard,
  reopenTask,
  restoreTask,
  setOrderStatusGates,
  setOrderStatusTransitions,
  updateOrderStatus,
  updateTask,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestOrder } from "./order-helpers";
import { statusByName } from "./order-status-helpers";
import { addTask, type TaskSetup, taskSetup } from "./task-helpers";

type Ctx = { context: ExecuteContext };

const flag = ({ context, id, tasks }: Ctx & { id: string; tasks: boolean }) =>
  execute({ operation: updateOrderStatus, input: { id, tasks }, context });

const move = ({ context, id, statusId }: Ctx & { id: string; statusId: string }) =>
  execute({ operation: moveTask, input: { id, statusId }, context });

const board = async ({ context, input = {} }: Ctx & { input?: Record<string, unknown> }) =>
  unwrap({ result: await execute({ operation: pipelineBoard, input, context }) });

const taskStatus = async ({ context, id }: Ctx & { id: string }) => {
  const page = unwrap({ result: await execute({ operation: listTasks, input: {}, context }) });
  return page.items.find((task) => task.id === id)?.statusId;
};

/** The default pipeline (Lead, Confirmed, Completed, Lost): Lead and Confirmed hold tasks. */
async function setup() {
  const base = await taskSetup();
  const { context } = base;
  const lead = await statusByName({ context, name: "Lead" });
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const lost = await statusByName({ context, name: "Lost" });
  return { ...base, lead, confirmed, lost };
}

const orphan = ({ context, setup: s }: Ctx & { setup: TaskSetup }) =>
  addTask({ context, setup: s, customerId: undefined, contactId: undefined });

describe("tasks on the pipeline (ADR 0121)", () => {
  it("starts a task in the entry status, else the first that holds tasks, else none", async () => {
    const s = await setup();
    const { context } = s;
    expect(s.lead.tasks).toBe(true);
    const first = unwrap({ result: await addTask({ context, setup: s }) });
    expect(first.statusId).toBe(s.lead.id);
    unwrap({ result: await flag({ context, id: s.lead.id, tasks: false }) });
    // Clearing the flag moves the status's tasks to the first status that holds tasks.
    expect(await taskStatus({ context, id: first.id })).toBe(s.confirmed.id);
    const second = unwrap({ result: await addTask({ context, setup: s }) });
    expect(second.statusId).toBe(s.confirmed.id);
    unwrap({ result: await flag({ context, id: s.confirmed.id, tasks: false }) });
    expect(await taskStatus({ context, id: first.id })).toBeNull();
    const none = unwrap({ result: await orphan({ context, setup: s }) });
    expect(none.statusId).toBeNull();
    // A status that starts to hold tasks gives the tasks without one a status.
    unwrap({ result: await flag({ context, id: s.confirmed.id, tasks: true }) });
    expect(await taskStatus({ context, id: none.id })).toBe(s.confirmed.id);
    const listed = await execute({
      operation: listTasks,
      input: { statusId: s.confirmed.id },
      context,
    });
    expect(unwrap({ result: listed }).items).toHaveLength(3);
  });

  it("refuses tasks in a closing status and a closing status that holds tasks", async () => {
    const s = await setup();
    const { context } = s;
    const refused = await flag({ context, id: s.lost.id, tasks: true });
    expect(refused.ok ? null : refused.error.issues[0]?.path).toBe("tasks");
    const closing = await execute({
      operation: updateOrderStatus,
      input: { id: s.confirmed.id, closes: true },
      context,
    });
    expect(closing.ok ? null : closing.error.issues[0]?.path).toBe("closes");
    const created = await execute({
      operation: createOrderStatus,
      input: { name: "Visit", color: "#112233", tasks: true },
      context,
    });
    expect(unwrap({ result: created }).tasks).toBe(true);
  });

  it("moves a task like an order: flagged targets, Allowed next and the gates it can meet", async () => {
    const s = await setup();
    const { context } = s;
    const task = unwrap({ result: await addTask({ context, setup: s, assigneeId: null }) });
    const lost = await move({ context, id: task.id, statusId: s.lost.id });
    expect(lost.ok ? null : [lost.error.code, lost.error.issues[0]?.path]).toEqual([
      "VALIDATION",
      "statusId",
    ]);
    const gates = [{ fromStatusId: null, gates: ["ASSIGNEE", "REASON"] as const }];
    const gated = { id: s.confirmed.id, gates: gates.map((g) => ({ ...g, gates: [...g.gates] })) };
    unwrap({ result: await execute({ operation: setOrderStatusGates, input: gated, context }) });
    // ASSIGNEE reads the task's assignee; REASON reads order history and is skipped.
    const blocked = await move({ context, id: task.id, statusId: s.confirmed.id });
    expect(blocked.ok ? null : blocked.error.issues.map((i) => i.path)).toEqual(["assigneeId"]);
    const assignee = { id: task.id, assigneeId: s.anna };
    unwrap({ result: await execute({ operation: updateTask, input: assignee, context }) });
    const moved = unwrap({
      result: await move({ context, id: task.id, statusId: s.confirmed.id }),
    });
    expect(moved.statusId).toBe(s.confirmed.id);
    const again = await move({ context, id: task.id, statusId: s.confirmed.id });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const only = { id: s.confirmed.id, allowedNext: "ONLY_THESE" as const, toStatusIds: [] };
    unwrap({
      result: await execute({ operation: setOrderStatusTransitions, input: only, context }),
    });
    const back = await move({ context, id: task.id, statusId: s.lead.id });
    expect(errorCode({ result: back })).toBe("CONFLICT");
  });

  it("refuses moving a task with an order or a done task", async () => {
    const s = await setup();
    const { context } = s;
    const order = await createTestOrder({
      ...{ context, entityTypeId: s.type.id, customerId: s.customer.id },
    });
    const linked = unwrap({ result: await addTask({ context, setup: s, orderId: order.id }) });
    expect(linked.statusId).toBeNull();
    const follows = await move({ context, id: linked.id, statusId: s.confirmed.id });
    expect(errorCode({ result: follows })).toBe("CONFLICT");
    const done = unwrap({ result: await addTask({ context, setup: s }) });
    unwrap({ result: await execute({ operation: completeTask, input: { id: done.id }, context }) });
    const off = await move({ context, id: done.id, statusId: s.confirmed.id });
    expect(errorCode({ result: off })).toBe("CONFLICT");
  });

  it("clears the status on link and puts the task back on unlink", async () => {
    const s = await setup();
    const { context } = s;
    const order = await createTestOrder({
      ...{ context, entityTypeId: s.type.id, customerId: s.customer.id },
    });
    const task = unwrap({ result: await addTask({ context, setup: s }) });
    unwrap({ result: await move({ context, id: task.id, statusId: s.confirmed.id }) });
    const link = { taskId: task.id, orderId: order.id };
    const linked = unwrap({
      result: await execute({ operation: linkTaskOrder, input: link, context }),
    });
    expect(linked.statusId).toBeNull();
    const unlink = { id: task.id, orderId: null };
    const back = unwrap({
      result: await execute({ operation: updateTask, input: unlink, context }),
    });
    expect(back.statusId).toBe(s.lead.id);
  });

  it("keeps a done task's status and returns it there on reopen, or to the default", async () => {
    const s = await setup();
    const { context } = s;
    const task = unwrap({ result: await addTask({ context, setup: s }) });
    unwrap({ result: await move({ context, id: task.id, statusId: s.confirmed.id }) });
    const input = { id: task.id };
    unwrap({ result: await execute({ operation: completeTask, input, context }) });
    expect((await board({ context })).taskCards).toEqual([]);
    const reopened = unwrap({ result: await execute({ operation: reopenTask, input, context }) });
    expect(reopened.statusId).toBe(s.confirmed.id);
    unwrap({ result: await execute({ operation: completeTask, input, context }) });
    unwrap({ result: await flag({ context, id: s.confirmed.id, tasks: false }) });
    const fallback = unwrap({ result: await execute({ operation: reopenTask, input, context }) });
    expect(fallback.statusId).toBe(s.lead.id);
    unwrap({ result: await execute({ operation: archiveTask, input, context }) });
    unwrap({ result: await flag({ context, id: s.confirmed.id, tasks: true }) });
    const restored = unwrap({ result: await execute({ operation: restoreTask, input, context }) });
    expect(restored.statusId).toBe(s.lead.id);
  });

  it("moves the tasks of an archived status to the default", async () => {
    const s = await setup();
    const { context } = s;
    const task = unwrap({ result: await addTask({ context, setup: s }) });
    unwrap({ result: await move({ context, id: task.id, statusId: s.confirmed.id }) });
    const archive = { id: s.confirmed.id, targetStatusId: s.lead.id };
    unwrap({ result: await execute({ operation: archiveOrderStatus, input: archive, context }) });
    expect(await taskStatus({ context, id: task.id })).toBe(s.lead.id);
  });

  it("shows open tasks without an order as task cards in the phase of their status", async () => {
    const s = await setup();
    const { context } = s;
    const order = await createTestOrder({
      ...{ context, entityTypeId: s.type.id, customerId: s.customer.id },
    });
    const task = unwrap({ result: await addTask({ context, setup: s }) });
    await addTask({ context, setup: s, orderId: order.id });
    const shown = await board({ context });
    const lead = shown.columns.find((column) => column.statuses.some((x) => x.id === s.lead.id));
    expect(lead?.statuses.find((x) => x.id === s.lead.id)?.tasks).toBe(true);
    expect(shown.cards.map((card) => [card.kind, card.id])).toEqual([["order", order.id]]);
    expect(shown.taskCards).toEqual([
      {
        ...{ kind: "task", id: task.id, columnId: lead?.id, statusId: s.lead.id },
        ...{ typeName: "Site visit", customerId: s.customer.id, dueAt: task.dueAt },
        ...{ overdue: false, assigneeId: context.actor.userId },
        allowedStatusIds: [s.confirmed.id],
      },
    ]);
    expect(shown.unmappedCount).toBe(0);
  });

  it("filters task cards by assignee, hides them for an order type and without task:read", async () => {
    const s = await setup();
    const { context } = s;
    const mine = unwrap({ result: await addTask({ context, setup: s }) });
    await addTask({ context, setup: s, assigneeId: s.anna });
    expect((await board({ context })).taskCards).toHaveLength(2);
    const filtered = await board({ context, input: { assigneeId: context.actor.userId } });
    expect(filtered.taskCards.map((card) => card.id)).toEqual([mine.id]);
    const typed = await board({ context, input: { entityTypeId: s.type.id } });
    expect(typed.taskCards).toEqual([]);
    const permissions = applyOverrides({
      preset: "admin",
      overrides: [{ feature: "task", action: "read", effect: "deny" }],
    });
    expect((await board({ context: { ...context, permissions } })).taskCards).toEqual([]);
  });

  it("offers no move the gate refuses on a card", async () => {
    const s = await setup();
    const { context } = s;
    await addTask({ context, setup: s, assigneeId: null });
    const [card] = (await board({ context })).taskCards;
    // Confirmed asks for an assignee (the default template's gate).
    expect(card?.allowedStatusIds).toEqual([]);
  });
});
