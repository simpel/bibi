import { getDb } from "@okazi/db";
import {
  changeTicketPhase,
  createContact,
  createEntityType,
  createTicket,
  type ExecuteContext,
  execute,
  provisionOrganization,
} from "../src/index";
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
  unwrap({ result: await provisionOrganization({ organizationId: context.organizationId }) });
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

export type MoveToPhaseInput = {
  context: ExecuteContext;
  ticketId: string;
  /** The phase name, e.g. "Lost" from the default template. */
  name: string;
  reason?: string;
};

/** Moves the ticket to the named phase through `ticket.changePhase`; returns the result. */
export async function moveToPhase({ context, ticketId, name, reason }: MoveToPhaseInput) {
  const phase = await getDb().ticketPhase.findFirstOrThrow({
    where: { organizationId: context.organizationId, name, status: "ACTIVE" },
  });
  const input = { ticketId, phaseId: phase.id, reason };
  return execute({ operation: changeTicketPhase, input, context });
}

export type PlaceInPhaseInput = {
  ticket: { id: string; organizationId: string; phaseId: string };
  phaseId: string;
};

/**
 * Puts a ticket in a phase without the move rules, through its phase history (ADR 0054: the only
 * way `phaseId` changes). For tests whose subject is not the move itself.
 */
export async function placeInPhase({ ticket, phaseId }: PlaceInPhaseInput): Promise<void> {
  if (phaseId === ticket.phaseId) return;
  await getDb().ticketPhaseChange.create({
    data: {
      ...{ organizationId: ticket.organizationId, ticketId: ticket.id },
      ...{ fromPhaseId: ticket.phaseId, toPhaseId: phaseId, trigger: "SYSTEM" },
    },
  });
}
