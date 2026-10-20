import { describe, expect, it } from "vitest";
import { createTicket, type ExecuteContext, execute, grantAll, updateTicket } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { testOrg } from "./org-helpers";
import { createTestContact, createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";

type PathsInput = {
  context: ExecuteContext;
  input: Record<string, unknown>;
  /** Present = `ticket.update` of this ticket, absent = `ticket.create`. */
  ticketId?: string;
};

async function refusal({ context, input, ticketId }: PathsInput) {
  const result = ticketId
    ? await execute({ operation: updateTicket, input: { id: ticketId, ...input }, context })
    : await execute({ operation: createTicket, input, context });
  return result.ok ? null : { code: result.error.code, path: result.error.issues[0]?.path };
}

describe("ticket referenced ids (ADR 0004)", () => {
  it("refuses ids from another organization on create and update", async () => {
    const { context, type, customer } = await ticketSetup();
    const foreign = await testOrg();
    const foreignCustomer = await createTestCustomer({ context: foreign, name: "Foreign AB" });
    const foreignContact = await createTestContact({
      context: foreign,
      customerId: foreignCustomer.id,
    });
    const foreignUser = await memberUser({ context: foreign, name: "Outsider" });
    const base = { entityTypeId: type.id, customerId: customer.id };
    const ticket = await createTestTicket({ context, ...base });
    for (const input of [{ customerId: foreignCustomer.id }, { contactId: foreignContact.id }]) {
      const path = Object.keys(input)[0];
      const create = await refusal({ context, input: { ...base, ...input } });
      expect(create).toMatchObject({ code: "VALIDATION", path });
      expect(await refusal({ context, input, ticketId: ticket.id })).toMatchObject({
        code: "VALIDATION",
        path,
      });
    }
    const assignee = await refusal({ context, input: { ...base, assigneeId: foreignUser } });
    expect(assignee).toMatchObject({ code: "VALIDATION", path: "assigneeId" });
  });

  it("needs read access to the customer and contact it refers to", async () => {
    const { context, type, customer } = await ticketSetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const base = { entityTypeId: type.id, customerId: customer.id };
    const all = grantAll({});
    // Contacts are part of the customer feature (ADR 0050).
    const noCustomer = { ...context, permissions: { ...all, customer: [] } };
    expect(await refusal({ context: noCustomer, input: base })).toMatchObject({
      code: "VALIDATION",
      path: "customerId",
    });
    const ticket = await createTestTicket({ context, ...base });
    const update = await refusal({
      context: noCustomer,
      input: { contactId: contact.id },
      ticketId: ticket.id,
    });
    expect(update).toMatchObject({ code: "VALIDATION", path: "contactId" });
  });
});
