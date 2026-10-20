import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, type ExecuteContext, execute, getTicket, grantAll } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestTicket, placeInPhase, ticketSetup } from "./ticket-helpers";
import { phases } from "./ticket-phase-helpers";

type TicketsInput = { context: ExecuteContext; entityTypeId: string; customerId: string };

/** One ticket in each phase (Lead, Confirmed, Completed, Lost). */
async function ticketPerPhase({ context, ...input }: TicketsInput): Promise<string[]> {
  const ids: string[] = [];
  for (const phase of await phases({ context })) {
    const ticket = await createTestTicket({ context, ...input });
    // Placed directly: the phase rules are not what this test is about.
    await placeInPhase({ ticket, phaseId: phase.id });
    ids.push(ticket.id);
  }
  return ids;
}

async function setupWithTickets() {
  const setup = await ticketSetup();
  const { context, type, customer } = setup;
  const ids = await ticketPerPhase({ context, entityTypeId: type.id, customerId: customer.id });
  return { ...setup, ids };
}

const archivedStatus = async ({ ids }: { ids: string[] }) =>
  (await getDb().ticket.findMany({ where: { id: { in: ids } } })).map((row) => row.status);

describe("customer.archive with the customer's tickets (#134)", () => {
  it("is blocked by tickets in every phase, with the count, unless archiveTickets is set", async () => {
    const { context, customer, ids } = await setupWithTickets();
    expect(ids).toHaveLength(4);
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.message).toContain("4 tickets");
    expect(refused.error.issues).toEqual([
      expect.objectContaining({ path: "archiveTickets", message: expect.stringContaining("4") }),
    ]);
    expect(await archivedStatus({ ids })).toEqual(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE"]);
  });

  it("archives the customer and all its tickets, with one audit row each", async () => {
    const { context, customer, ids } = await setupWithTickets();
    const archived = unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: customer.id, archiveTickets: true },
        context,
      }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", ticketCount: 0 });
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ARCHIVED"));
    const gone = await execute({ operation: getTicket, input: { id: ids[0] ?? "" }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "customer.archive" },
    });
    const rows = audit.map((row) => [row.entityType, row.entityId]);
    expect(rows).toHaveLength(5);
    expect(rows).toEqual(
      expect.arrayContaining([["customer", customer.id], ...ids.map((id) => ["ticket", id])]),
    );
    const ticketRow = audit.find((row) => row.entityId === ids[0]);
    expect(ticketRow?.before).toMatchObject({ status: "ACTIVE" });
    expect(ticketRow?.after).toMatchObject({ status: "ARCHIVED" });
  });

  it("never touches another organization's tickets", async () => {
    const own = await setupWithTickets();
    const other = await setupWithTickets();
    unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: own.customer.id, archiveTickets: true },
        context: own.context,
      }),
    });
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
    const foreign = await execute({
      operation: archiveCustomer,
      input: { id: other.customer.id, archiveTickets: true },
      context: own.context,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("needs ticket:write to archive the tickets and then changes nothing", async () => {
    const { context, customer, ids } = await setupWithTickets();
    const permissions = { ...grantAll({}), ticket: ["read" as const] };
    const reader = testContext({ organizationId: context.organizationId, permissions });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveTickets: true },
      context: reader,
    });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("ignores tickets that are already archived", async () => {
    const { context, customer, ids } = await setupWithTickets();
    await getDb().ticket.updateMany({ where: { id: { in: ids } }, data: { status: "ARCHIVED" } });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
  });
});
