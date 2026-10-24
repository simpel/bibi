import { describe, expect, it } from "vitest";
import { changeTicketStatus, execute } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";
import { createTestTicket } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("cancelling a ticket releases its lines' occupancy (ADR 0022)", () => {
  it("frees the item and the changeover for another ticket, keeping the line", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await createTestLine({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const other = await createTestTicket({
      context,
      entityTypeId: ticket.entityTypeId,
      customerId: ticket.customerId,
    });
    const clash = await createTestLine({ ...base, ticketId: other.id, from: 10, to: 12 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");

    const cancelled = await statusByName({ context, name: "Lost" });
    unwrap({
      result: await execute({
        operation: changeTicketStatus,
        input: { ticketId: ticket.id, statusId: cancelled.id, reason: "Moved online" },
        context,
      }),
    });

    const retry = await createTestLine({ ...base, ticketId: other.id, from: 9, to: 12 });
    expect(errorCode({ result: retry })).toBeNull();
    const kept = await context.db.line.findFirstOrThrow({ where: { id: item.id } });
    expect(kept.status).toBe("ACTIVE");
    // Holds are a projection (ADR 0053): the status and line changes are audited, not the holds.
    const audit = await context.db.auditLog.findMany({
      where: { entityType: "occupancy", operation: "ticket.changeStatus" },
    });
    expect(audit).toHaveLength(0);
  });
});
