import { ok, type Result } from "../../errors/result";
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

type PartyOfInput = TaskInput & { customerId: string; firstContactId: string };

/** The named contact at the customer, else its first one. */
async function contactIdOf({ context, task, customerId, firstContactId }: PartyOfInput) {
  if (!task.contact) return ok({ value: firstContactId });
  const row = await context.db.contact.findFirst({ where: { customerId, name: task.contact } });
  return row ? ok({ value: row.id }) : missing({ what: `contact ${task.contact}` });
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

async function seedTask({ ...input }: TaskInput): Promise<Result<string>> {
  const { context, refs, userIds, task, now } = input;
  const type = refs.taskTypes.get(task.type);
  if (!type) return missing({ what: `task type ${task.type}` });
  const assigneeId = userIds.get(task.assignee);
  if (!assigneeId) return missing({ what: `user ${task.assignee}` });
  const party = await loadParty({ context, customer: task.customer });
  if (!party.ok) return party;
  const { customerId, contactId: firstContactId } = party.value;
  const contact = await contactIdOf({ ...input, customerId, firstContactId });
  if (!contact.ok) return contact;
  const order = task.order ? await orderIdOf({ ...input, ref: task.order, customerId }) : null;
  if (order && !order.ok) return order;
  const item = task.item ? await context.db.item.findFirst({ where: { name: task.item } }) : null;
  if (task.item && !item) return missing({ what: `item ${task.item}` });
  const timeZone = demoTimeZones({ org: input.org }).order;
  const time = ({ value, day }: { value: string; day: number }) =>
    at({ now, day, time: value, timeZone });
  const day = demoTaskDay({ task, now, timeZone });
  const created = await execute({
    operation: createTask,
    input: {
      ...{ entityTypeId: type.id, customerId, contactId: contact.value, assigneeId },
      ...(order?.ok ? { orderId: order.value } : {}),
      ...(item ? { itemId: item.id } : {}),
      startsAt: time({ value: task.from, day }),
      ...(task.to ? { endsAt: time({ value: task.to, day }) } : {}),
      ...(task.note ? { note: task.note } : {}),
    },
    context,
  });
  if (!created.ok) return created;
  const taskId = created.value.id;
  if (task.doneDay === undefined) return ok({ value: taskId });
  const doneAt = time({ value: task.to ?? task.from, day: task.doneDay });
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
