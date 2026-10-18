import { describe, expect, it } from "vitest";
import { archiveContact, execute, updateTicket } from "../src/index";
import { unwrap } from "./helpers";
import { createTestContact, createTestTicket, ticketSetup } from "./ticket-helpers";

describe("ticket.update with an archived contact (ADR 0043)", () => {
  it("keeps the contact and updates other details after it has been archived", async () => {
    const { context, type, customer } = await ticketSetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      contactId: contact.id,
    });
    unwrap({
      result: await execute({ operation: archiveContact, input: { id: contact.id }, context }),
    });
    const updated = unwrap({
      result: await execute({
        operation: updateTicket,
        input: { id: ticket.id, budgetMinor: 1_000_000 },
        context,
      }),
    });
    expect(updated).toMatchObject({ budgetMinor: 1_000_000, contactId: contact.id });
    const again = await execute({
      operation: updateTicket,
      input: { id: ticket.id, contactId: contact.id, budgetMinor: 2_000_000 },
      context,
    });
    expect(again.ok).toBe(true);
  });
});
