import {
  type AnyOperation,
  createCustomer,
  createEntityType,
  createExecuteContext,
  createItem,
  createItemState,
  createLine,
  createTicket,
  type ExecuteContext,
  execute,
  grantAll,
  provisionOrganization,
  updateEntityType,
} from "@bibi/core";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";

type RunInput = { context: ExecuteContext; operation: AnyOperation; input: unknown };

/** Runs an operation and returns its value, or throws its error. */
async function run<T = { id: string }>({ context, operation, input }: RunInput): Promise<T> {
  const result = await execute({ operation, input, context });
  if (!result.ok) throw result.error;
  return result.value as T;
}

/** A fresh organization provisioned like a real signup, with an admin context. */
async function provisionedOrg() {
  const organizationId = `org_${createId()}`;
  const data = { id: organizationId, name: organizationId, slug: organizationId };
  await getDb().organization.create({ data: { ...data, createdAt: new Date() } });
  await provisionOrganization({ organizationId });
  return createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({}),
    actor: { type: "user", userId: `user_${createId()}` },
  });
}

/** A room type with Prebooked (soft, expires, initial) and Released as its expiry state. */
async function roomType({ context }: { context: ExecuteContext }) {
  const input = { base: "ITEM", name: "Room", capabilities: ["BOOKABLE"] };
  const type = await run({ context, operation: createEntityType, input });
  const color = "#64748b";
  const state = { entityTypeId: type.id, color };
  const soft = { ...state, name: "Prebooked", hold: "SOFT", expires: true, initial: true };
  const prebooked = await run({ context, operation: createItemState, input: soft });
  const released = { ...state, name: "Released", released: true };
  const expiry = await run({ context, operation: createItemState, input: released });
  const update = { id: type.id, expiryStateId: expiry.id };
  await run({ context, operation: updateEntityType, input: update });
  return { type, prebooked, expiry };
}

/** A ticket whose holdsUntil has passed, with one soft-held room line. */
export async function expiredTicket() {
  const context = await provisionedOrg();
  const { type, prebooked, expiry } = await roomType({ context });
  const typeOf = ({ base }: { base: string }) =>
    run({ context, operation: createEntityType, input: { base, name: base } });
  const customerType = await typeOf({ base: "CUSTOMER" });
  const customer = await run({
    context,
    operation: createCustomer,
    input: { entityTypeId: customerType.id, name: "Hisingen Energi AB" },
  });
  const ticketType = await typeOf({ base: "TICKET" });
  const holdsUntil = new Date(Date.now() - 60_000);
  const ticketInput = { entityTypeId: ticketType.id, customerId: customer.id, holdsUntil };
  const ticket = await run({ context, operation: createTicket, input: ticketInput });
  const lineType = await typeOf({ base: "LINE" });
  const item = await run({
    context,
    operation: createItem,
    input: { entityTypeId: type.id, name: "Hall" },
  });
  const line = await run({
    context,
    operation: createLine,
    input: {
      ...{ ticketId: ticket.id, entityTypeId: lineType.id, itemId: item.id, name: "Session" },
      ...{ startsAt: "2026-12-01T08:00:00Z", endsAt: "2026-12-01T12:00:00Z" },
    },
  });
  return { context, line, prebooked, expiry };
}
