import { ok, type Result } from "../../errors/result";
import { moveTask } from "../../features/task/move-operation";
import { completeTask } from "../../features/task/state-operations";
import { createTask } from "../../features/task/write-operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { PRESET_PERMISSIONS } from "../../permissions/presets";
import { ALL_RECORDS } from "../../permissions/record-scope";
import { weekdayOf } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoRefs } from "./demo-refs";
import { demoTimeZones } from "./demo-time-zones";
import { demoTitle } from "./demo-title";
import { missing } from "./seed-fields";
import { at } from "./seed-order-create";
import { loadParty } from "./seed-order-party";
import type { DemoTask } from "./task-types";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoTasksInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  userIds: DemoUserIds;
  /** The day of the run (D in `docs/demo-seed.md`); defaults to now. */
  now?: Date;
};

type TaskInput = Omit<SeedDemoTasksInput, "now"> & { task: DemoTask; now: Date };

export type DemoTaskDayInput = { task: DemoTask; now: Date; timeZone: string };

/** The task's day offset: `day`, else the days until the next `weekday` after today (1–7). */
export function demoTaskDay({ task, now, timeZone }: DemoTaskDayInput): number {
  if (task.weekday === undefined) return task.day ?? 0;
  const today = weekdayOf({ date: toZonedParts({ instant: now, timeZone }).date });
  return (task.weekday - today + 7) % 7 || 7;
}

type OrderOfInput = TaskInput & { ref: string; customerId: string };

/** The seeded order of the data files' `ref`, found by its title and customer. */
async function orderIdOf({ context, org, ref, customerId }: OrderOfInput) {
  const order = org.orders.find((candidate) => candidate.ref === ref);
  if (!order) return missing({ what: `order ${ref}` });
  const row = await context.db.order.findFirst({
    where: { title: demoTitle({ order }), customerId },
    select: { id: true },
  });
  return row ? ok({ value: row.id }) : missing({ what: `order ${ref}` });
}

type Party = { customerId?: string; contactId?: string; orderId?: string };

/** The task's customer, the named contact at it (else its first one) and its order, if any. */
async function partyOf({ ...input }: TaskInput): Promise<Result<Party>> {
  const { context, task } = input;
  if (!task.customer) return ok({ value: {} });
  const party = await loadParty({ context, customer: task.customer });
  if (!party.ok) return party;
  const { customerId } = party.value;
  const contact = task.contact
    ? await context.db.contact.findFirst({ where: { customerId, name: task.contact } })
    : { id: party.value.contactId };
  if (!contact) return missing({ what: `contact ${task.contact}` });
  const order = task.order ? await orderIdOf({ ...input, ref: task.order, customerId }) : null;
  if (order && !order.ok) return order;
  const orderId = order?.ok ? { orderId: order.value } : {};
  return ok({ value: { customerId, contactId: contact.id, ...orderId } });
}

type Clock = (input: { value: string; day: number }) => Date;

/** The task's rooms by name, each held for its own window (ADR 0120). */
async function itemsOf({ context, task, time }: TaskInput & { time: Clock }) {
  const items = [];
  for (const room of task.items ?? []) {
    const row = await context.db.item.findFirst({ where: { name: room.item } });
    if (!row) return missing({ what: `item ${room.item}` });
    const held = room.hold !== "RELATED" && room.from && room.to;
    const day = room.day ?? 0;
    items.push({
      ...{ itemId: row.id, hold: room.hold },
      ...(held ? { startsAt: time({ value: room.from ?? "", day }) } : {}),
      ...(held ? { endsAt: time({ value: room.to ?? "", day }) } : {}),
    });
  }
  return ok({ value: items });
}

type DoneInput = { context: ExecuteContext; taskId: string; userId: string; at: Date };

/** Marked done by the assignee acting as themself (manager preset), so it shows who did it. */
async function markDone({ context, taskId, userId, at: doneAt }: DoneInput) {
  const own = createExecuteContext({
    organizationId: context.organizationId,
    roles: ["manager"],
    permissions: PRESET_PERMISSIONS.manager,
    preset: "manager",
    scopes: ALL_RECORDS,
    actor: { type: "user", userId },
  });
  const input = { id: taskId };
  return execute({ operation: completeTask, input, context: { ...own, now: () => doneAt } });
}

type MoveInput = { context: ExecuteContext; taskId: string; status: string | undefined };

/** Moves a task without an order to its named status on the pipeline (ADR 0121). */
async function moveToStatus({ context, taskId, status }: MoveInput): Promise<Result<true>> {
  if (!status) return ok({ value: true });
  const row = await context.db.orderStatus.findFirst({ where: { name: status } });
  if (!row) return missing({ what: `status ${status}` });
  const input = { id: taskId, statusId: row.id };
  const moved = await execute({ operation: moveTask, input, context });
  return moved.ok ? ok({ value: true }) : moved;
}

async function seedTask({ ...input }: TaskInput): Promise<Result<string>> {
  const { context, refs, userIds, task, now } = input;
  const type = refs.taskTypes.get(task.type);
  if (!type) return missing({ what: `task type ${task.type}` });
  const assigneeId = userIds.get(task.assignee);
  if (!assigneeId) return missing({ what: `user ${task.assignee}` });
  const party = await partyOf(input);
  if (!party.ok) return party;
  const timeZone = demoTimeZones({ org: input.org }).order;
  const time: Clock = ({ value, day }) => at({ now, day, time: value, timeZone });
  const items = await itemsOf({ ...input, time });
  if (!items.ok) return items;
  const day = demoTaskDay({ task, now, timeZone });
  const created = await execute({
    operation: createTask,
    input: {
      ...{ entityTypeId: type.id, assigneeId, ...party.value },
      ...(items.value.length > 0 ? { items: items.value } : {}),
      ...(task.due ? { dueAt: time({ value: task.due, day }) } : {}),
      ...(task.note ? { note: task.note } : {}),
    },
    context,
  });
  if (!created.ok) return created;
  const taskId = created.value.id;
  const moved = await moveToStatus({ context, taskId, status: task.status });
  if (!moved.ok) return moved;
  if (task.doneDay === undefined) return ok({ value: taskId });
  const doneAt = time({ value: task.due ?? "12:00", day: task.doneDay });
  const done = await markDone({ context, taskId, userId: assigneeId, at: doneAt });
  return done.ok ? ok({ value: taskId }) : done;
}

/**
 * ADR 0117: the organization's tasks after its orders, as SYSTEM through `task.create` (which
 * links the order and tells the assignee); a done one is marked done by its assignee.
 */
export async function seedDemoTasks({
  now = new Date(),
  ...input
}: SeedDemoTasksInput): Promise<Result<number>> {
  for (const task of input.org.tasks ?? []) {
    const seeded = await seedTask({ ...input, task, now });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: input.org.tasks?.length ?? 0 });
}
