import { describe, expect, it } from "vitest";
import { changeTicketPhase, execute } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";
import { createTestTicket } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

describe("cancelling a ticket releases its program items' occupancy (ADR 0022)", () => {
  it("frees the item and the changeover for another ticket, keeping the program item", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await addProgramItem({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const other = await createTestTicket({
      context,
      entityTypeId: ticket.entityTypeId,
      customerId: ticket.customerId,
    });
    const clash = await addProgramItem({ ...base, ticketId: other.id, from: 10, to: 12 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");

    const cancelled = await phaseByName({ context, name: "Lost" });
    unwrap({
      result: await execute({
        operation: changeTicketPhase,
        input: { ticketId: ticket.id, phaseId: cancelled.id, reason: "Moved online" },
        context,
      }),
    });

    const retry = await addProgramItem({ ...base, ticketId: other.id, from: 9, to: 12 });
    expect(errorCode({ result: retry })).toBeNull();
    const kept = await context.db.programItem.findFirstOrThrow({ where: { id: item.id } });
    expect(kept.status).toBe("ACTIVE");
    const audit = await context.db.auditLog.findMany({
      where: { entityType: "occupancy", operation: "ticket.changePhase" },
    });
    expect(audit).toHaveLength(2);
  });
});
