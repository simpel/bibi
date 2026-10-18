import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, execute } from "../src/index";
import { errorCode } from "./helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

async function setupWithTickets({ count }: { count: number }) {
  const setup = await ticketSetup();
  const { context, type, customer } = setup;
  for (let index = 0; index < count; index += 1)
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
  return setup;
}

const activeTickets = ({ customerId }: { customerId: string }) =>
  getDb().ticket.count({ where: { customerId, status: "ACTIVE" } });

describe("customer.archive expectedTicketCount (#144)", () => {
  it("refuses with CONFLICT when tickets were added after the approval", async () => {
    const { context, type, customer } = await setupWithTickets({ count: 2 });
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveTickets: true, expectedTicketCount: 2 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.issues).toEqual([
      expect.objectContaining({ path: "expectedTicketCount" }),
    ]);
    expect(await activeTickets({ customerId: customer.id })).toBe(3);
  });

  it("archives when the count matches what was approved", async () => {
    const { context, customer } = await setupWithTickets({ count: 2 });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveTickets: true, expectedTicketCount: 2 },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
    expect(await activeTickets({ customerId: customer.id })).toBe(0);
  });

  it("refuses when fewer tickets remain than were approved, even none", async () => {
    const { context, customer } = await setupWithTickets({ count: 0 });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveTickets: true, expectedTicketCount: 1 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await getDb().customer.findUnique({ where: { id: customer.id } });
    expect(row?.status).toBe("ACTIVE");
  });
});
