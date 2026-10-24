import { getDb } from "@bibi/db";
import {
  changeTicketStatus,
  createContact,
  createEntityType,
  createTicket,
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

/** An organization provisioned like a real signup, with a ticket type and a customer. */
export async function ticketSetup() {
  const context = await testOrg();
  unwrap({
    result: await provisionOrganization({
      organizationId: context.organizationId,
      timeZone: FALLBACK_TIME_ZONE,
    }),
  });
  const { type, key } = await createTypeWithField({ context, base: "TICKET", name: "Conference" });
  const customer = await createTestCustomer({ context, name: "Hisingen Energi AB" });
  return { context, type, key, customer };
}

export type CreateTestTicketInput = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  assigneeId?: string;
  contactId?: string;
  desiredStartsAt?: Date;
  desiredEndsAt?: Date;
  estimatedHeadcount?: number;
};

/** A ticket desired tomorrow, three hours long, unless a period is given. */
export async function createTestTicket({ context, ...input }: CreateTestTicketInput) {
  const desiredStartsAt = new Date(Date.now() + 86_400_000);
  const desiredEndsAt = new Date(desiredStartsAt.getTime() + 3 * 3_600_000);
  return unwrap({
    result: await execute({
      operation: createTicket,
      input: { desiredStartsAt, desiredEndsAt, ...input },
      context,
    }),
  });
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
  ticketId: string;
  /** The status name, e.g. "Lost" from the default template. */
  name: string;
  reason?: string;
};

/** Moves the ticket to the named status through `ticket.changeStatus`; returns the result. */
export async function moveToStatus({ context, ticketId, name, reason }: MoveToStatusInput) {
  const ticketStatus = await getDb().ticketStatus.findFirstOrThrow({
    where: { organizationId: context.organizationId, name, status: "ACTIVE" },
  });
  const input = { ticketId, statusId: ticketStatus.id, reason };
  return execute({ operation: changeTicketStatus, input, context });
}

export type PlaceInStatusInput = {
  ticket: { id: string; organizationId: string; statusId: string };
  statusId: string;
};

/**
 * Puts a ticket in a status without the move rules, through its status history (ADR 0054: the only
 * way `statusId` changes). For tests whose subject is not the move itself.
 */
export async function placeInStatus({ ticket, statusId }: PlaceInStatusInput): Promise<void> {
  if (statusId === ticket.statusId) return;
  await getDb().ticketStatusChange.create({
    data: {
      ...{ organizationId: ticket.organizationId, ticketId: ticket.id },
      ...{ fromStatusId: ticket.statusId, toStatusId: statusId, trigger: "SYSTEM" },
    },
  });
}
