import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  calendarRange,
  dismissMyTask,
  execute,
  pipelineCues,
  updateTask,
  viewMyTasks,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { asMember, notificationsOf } from "./notification-helpers";
import { createTestOrder } from "./order-helpers";
import { addTask, inHours, taskSetup } from "./task-helpers";

const day = ({ days }: { days: number }) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe("tasks on other screens (ADR 0117)", () => {
  it("tells a new assignee once, and again when assigned anew", async () => {
    const setup = await taskSetup();
    const { context, anna } = setup;
    const task = unwrap({ result: await addTask({ context, setup, assigneeId: anna }) });
    const kinds = async () =>
      (await notificationsOf({ context, userId: anna })).items.map((item) => [
        item.kind,
        item.taskId,
        item.data.taskTypeName,
      ]);
    expect(await kinds()).toEqual([["ASSIGNED", task.id, "Site visit"]]);
    const input = { id: task.id, assigneeId: anna, note: "Bring brochures" };
    unwrap({ result: await execute({ operation: updateTask, input, context }) });
    expect(await kinds()).toHaveLength(1);
    const slot = { subjectType: "TASK" as const, subjectId: task.id };
    const clear = { ...slot, assigneeId: null };
    unwrap({ result: await execute({ operation: assignAssignment, input: clear, context }) });
    const back = { ...slot, assigneeId: anna };
    unwrap({ result: await execute({ operation: assignAssignment, input: back, context }) });
    expect(await kinds()).toHaveLength(2);
    const relation = await getDb().recordRelation.findMany({
      where: { recordId: task.id, status: "ACTIVE" },
      select: { principalId: true, relation: true },
    });
    expect(relation).toEqual(
      expect.arrayContaining([
        { principalId: anna, relation: "ASSIGNEE" },
        { principalId: context.actor.userId, relation: "CREATOR" },
      ]),
    );
  });

  it("asks the assignee about a task overdue or due today, dismissable", async () => {
    const setup = await taskSetup();
    const { context, anna } = setup;
    const past = { dueAt: inHours({ hours: -2 }) };
    const late = unwrap({ result: await addTask({ context, setup, assigneeId: anna, ...past }) });
    const later = { dueAt: inHours({ hours: 72 }) };
    unwrap({ result: await addTask({ context, setup, assigneeId: anna, ...later }) });
    // Without a due time a task never asks.
    unwrap({ result: await addTask({ context, setup, assigneeId: anna, dueAt: undefined }) });
    const member = asMember({ context, userId: anna });
    const needs = async () =>
      unwrap({ result: await execute({ operation: viewMyTasks, input: {}, context: member }) })
        .tasks ?? [];
    expect(await needs()).toEqual([
      expect.objectContaining({
        ...{ key: `TASK_DUE:${late.id}`, kind: "TASK_DUE", group: "LATE" },
        ...{ taskId: late.id, taskTypeName: "Site visit", orderId: null, reference: null },
        customerName: setup.customer.name,
      }),
    ]);
    const input = { key: `TASK_DUE:${late.id}` };
    unwrap({ result: await execute({ operation: dismissMyTask, input, context: member }) });
    expect(await needs()).toEqual([]);
  });

  it("shows an order's next open task on its cue and tasks on the calendar", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const order = await createTestOrder({
      ...{ context, entityTypeId: setup.type.id, customerId: setup.customer.id },
      contactId: setup.contact.id,
    });
    const linked = { orderId: order.id };
    const first = unwrap({ result: await addTask({ context, setup, ...linked }) });
    const later = { dueAt: inHours({ hours: 30 }) };
    unwrap({ result: await addTask({ context, setup, ...linked, ...later }) });
    // A task without a due time is neither next nor on the calendar.
    unwrap({ result: await addTask({ context, setup, ...linked, dueAt: undefined }) });
    const input = { orderIds: [order.id] };
    const { cues } = unwrap({ result: await execute({ operation: pipelineCues, input, context }) });
    expect(cues[0]?.nextTask).toMatchObject({
      ...{ id: first.id, typeName: "Site visit", dueAt: first.dueAt, overdue: false },
    });
    const span = { from: day({ days: -1 }), to: day({ days: 3 }) };
    const calendar = unwrap({
      result: await execute({ operation: calendarRange, input: span, context }),
    });
    expect(calendar.tasks.map((task) => task.orderId)).toEqual([order.id, order.id]);
    const blind = testContext({
      organizationId: context.organizationId,
      permissions: { order: ["read"], customer: ["read"] },
    });
    const hidden = unwrap({
      result: await execute({ operation: calendarRange, input: span, context: blind }),
    });
    expect(hidden.tasks).toEqual([]);
  });
});
