import { getDb } from "@bibi/db";
import {
  changeOrderStatus,
  createContact,
  createEntityType,
  createOrder,
  type ExecuteContext,
  execute,
  provisionOrganization,
} from "../src/index";
import { FALLBACK_TIME_ZONE } from "../src/time/time-zone";
import { createTestCustomer, createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

export type MemberUserInput = { context: ExecuteContext; name: string };

/** A member of the organization; returns its user id (what assignments refer to). */
export async function memberUser({ context, name }: MemberUserInput): Promise<string> {
  const memberId = await addTestMember({ context, role: "Sales", name });
  const member = await getDb().member.findUniqueOrThrow({ where: { id: memberId } });
  return member.userId;
}

/** An organization provisioned like a real signup, with an order type and a customer. */
export async function orderSetup() {
  const context = await testOrg();
  unwrap({
    result: await provisionOrganization({
      organizationId: context.organizationId,
      timeZone: FALLBACK_TIME_ZONE,
    }),
  });
  const { type, key } = await createTypeWithField({ context, base: "ORDER", name: "Conference" });
  const customer = await createTestCustomer({ context, name: "Hisingen Energi AB" });
  return { context, type, key, customer };
}

export type CreateTestOrderInput = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  assigneeId?: string;
  contactId?: string;
  desiredStartsAt?: Date;
  desiredEndsAt?: Date;
  estimatedHeadcount?: number;
};

/**
 * An order desired tomorrow, three hours long, unless a period is given. Every new order needs a
 * contact (ADR 0081): without one, the customer's first contact is used or one is created.
 */
export async function createTestOrder({ context, ...input }: CreateTestOrderInput) {
  const desiredStartsAt = new Date(Date.now() + 86_400_000);
  const desiredEndsAt = new Date(desiredStartsAt.getTime() + 3 * 3_600_000);
  const contactId =
    input.contactId ?? (await contactAt({ context, customerId: input.customerId })).id;
  return unwrap({
    result: await execute({
      operation: createOrder,
      input: { desiredStartsAt, desiredEndsAt, ...input, contactId },
      context,
    }),
  });
}

export type PartyOfInput = { order: { customerId: string; contactId: string | null } };

/** An order's customer and contact, to create another order for the same party (ADR 0081). */
export function partyOf({ order }: PartyOfInput) {
  if (!order.contactId) throw new Error("The order has no contact");
  return { customerId: order.customerId, contactId: order.contactId };
}

/** The customer's first active contact, or a new one (`createTestContact`). */
export async function contactAt({ context, customerId }: CreateTestContactInput) {
  const existing = await getDb().contact.findFirst({
    where: { organizationId: context.organizationId, customerId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  return existing ?? (await createTestContact({ context, customerId }));
}

export type CreateTestContactInput = { context: ExecuteContext; customerId: string };

/** A contact person at the customer, of a fresh CONTACT type. */
export async function createTestContact({ context, customerId }: CreateTestContactInput) {
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "CONTACT", name: `Contact ${customerId}` },
      context,
    }),
  });
  return unwrap({
    result: await execute({
      operation: createContact,
      input: { customerId, entityTypeId: type.id, name: "Anna Berg" },
      context,
    }),
  });
}

export type MoveToStatusInput = {
  context: ExecuteContext;
  orderId: string;
  /** The status name, e.g. "Lost" from the default template. */
  name: string;
  reason?: string;
};

/** Moves the order to the named status through `order.changeStatus`; returns the result. */
export async function moveToStatus({ context, orderId, name, reason }: MoveToStatusInput) {
  const orderStatus = await getDb().orderStatus.findFirstOrThrow({
    where: { organizationId: context.organizationId, name, status: "ACTIVE" },
  });
  const input = { orderId, statusId: orderStatus.id, reason };
  return execute({ operation: changeOrderStatus, input, context });
}

export type PlaceInStatusInput = {
  order: { id: string; organizationId: string; statusId: string };
  statusId: string;
};

/**
 * Puts an order in a status without the move rules, through its status history (ADR 0054: the only
 * way `statusId` changes). For tests whose subject is not the move itself.
 */
export async function placeInStatus({ order, statusId }: PlaceInStatusInput): Promise<void> {
  if (statusId === order.statusId) return;
  await getDb().orderStatusChange.create({
    data: {
      ...{ organizationId: order.organizationId, orderId: order.id },
      ...{ fromStatusId: order.statusId, toStatusId: statusId, trigger: "SYSTEM" },
    },
  });
}
