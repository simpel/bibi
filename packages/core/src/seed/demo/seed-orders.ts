import { ok, type Result } from "../../errors/result";
import { followAssignment } from "../../features/assignment/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import type { DemoTimeZones } from "./demo-time-zones";
import type { DemoOrder } from "./order-types";
import { missing, resolveDemoFields } from "./seed-fields";
import { seedDemoLines } from "./seed-lines";
import { seedOrderMoney } from "./seed-money";
import { seedOrderChoices } from "./seed-order-choices";
import { at, createOne } from "./seed-order-create";
import { loadParty } from "./seed-order-party";
import { moveStatus } from "./seed-order-status";
import type { DemoUserIds } from "./users";

export type SeedOrdersInput = {
  context: ExecuteContext;
  orders: readonly DemoOrder[];
  refs: DemoRefs;
  userIds: DemoUserIds;
  /** The zones the local times are read in (ADR 0064). */
  zones: DemoTimeZones;
  /** The day of the run (D in `docs/demo-seed.md`); defaults to now. */
  now?: Date;
};

type PeopleInput = { userIds: DemoUserIds; order: DemoOrder };

/** The user ids of the order's assignee and followers, or the first unknown name. */
function resolvePeople({ userIds, order }: PeopleInput) {
  const names = [...(order.assignee ? [order.assignee] : []), ...(order.followers ?? [])];
  const unknown = names.find((name) => !userIds.has(name));
  if (unknown) return missing({ what: `user ${unknown}` });
  const id = ({ name }: { name: string }) => userIds.get(name) ?? "";
  const assigneeId = order.assignee ? id({ name: order.assignee }) : null;
  const followerIds = (order.followers ?? []).map((name) => id({ name }));
  return ok({ value: { assigneeId, followerIds } });
}

type FollowInput = { context: ExecuteContext; orderId: string; userIds: readonly string[] };

/** Each user follows the order (ADR 0034). */
async function follow({ context, orderId, userIds }: FollowInput): Promise<Result<true>> {
  for (const userId of userIds) {
    const input = { subjectType: "ORDER" as const, subjectId: orderId, userId };
    const followed = await execute({ operation: followAssignment, input, context });
    if (!followed.ok) return followed;
  }
  return ok({ value: true });
}

type OrderInput = Omit<SeedOrdersInput, "orders" | "now"> & {
  order: DemoOrder;
  now: Date;
};

async function seedOrder({ context, refs, userIds, zones, order, now }: OrderInput) {
  const type = refs.orderTypes.get(order.type);
  if (!type) return missing({ what: `order type ${order.type}` });
  const found = await loadParty({ context, customer: order.customer });
  if (!found.ok) return found;
  const people = resolvePeople({ userIds, order });
  if (!people.ok) return people;
  const fields = await resolveDemoFields({ context, fields: order.fields, type });
  if (!fields.ok) return fields;
  // Lines (and a template's line times) are local to the venue (ADR 0064).
  const lineAt = ({ time }: { time: string }) =>
    at({ now, day: order.day, time, timeZone: zones.lines });
  const party = { ...found.value, assigneeId: people.value.assigneeId };
  const made = { context, order, typeId: type.id, party, fields: fields.value, now, zones };
  const created = await createOne({ ...made, lineAt });
  if (!created.ok) return created;
  const orderId = created.value.id;
  const followed = await follow({ context, orderId, userIds: people.value.followerIds });
  if (!followed.ok) return followed;
  const lines = await seedDemoLines({ context, orderId, order, at: lineAt });
  if (!lines.ok) return lines;
  const chosen = await seedOrderChoices({ ...{ context, orderId, userIds }, order });
  if (!chosen.ok) return chosen;
  const moved = await moveStatus({ context, order, orderId, now });
  return moved.ok ? seedOrderMoney({ context, order, orderId }) : moved;
}

/** Slice 5 of ADR 0025, started: orders with a main assignee, followers and status, as SYSTEM. */
export async function seedDemoOrders({
  orders,
  now = new Date(),
  ...rest
}: SeedOrdersInput): Promise<Result<true>> {
  for (const order of orders) {
    const result = await seedOrder({ ...rest, order, now });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
