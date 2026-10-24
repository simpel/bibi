import { describe, expect, it } from "vitest";
import { createTicketStatus, execute, previewArchiveTicketStatus } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestTicket, placeInStatus, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("ticketStatus.archivePreview (ADR 0043)", () => {
  it("counts the tickets that move and lists blockers without changing anything", async () => {
    const { context, type, customer } = await ticketSetup();
    const extra = unwrap({
      result: await execute({
        operation: createTicketStatus,
        input: { name: "Site visit", color: "#0d9488" },
        context,
      }),
    });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await placeInStatus({ ticket, statusId: extra.id });
    const preview = ({ ...input }: { id: string; targetStatusId?: string }) =>
      execute({ operation: previewArchiveTicketStatus, input, context });
    const noTarget = unwrap({ result: await preview({ id: extra.id }) });
    expect(noTarget).toMatchObject({ archivable: false, moving: 1, targetRequired: true });
    expect(noTarget.blockers.length).toBeGreaterThan(0);
    const lost = await statusByName({ context, name: "Lost" });
    const blocked = unwrap({ result: await preview({ id: extra.id, targetStatusId: lost.id }) });
    expect(blocked).toMatchObject({ archivable: false, moving: 1 });
    const lead = await statusByName({ context, name: "Lead" });
    const entry = unwrap({ result: await preview({ id: lead.id }) });
    expect(entry.archivable).toBe(false);
    const row = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(row.statusId).toBe(extra.id);
    const ticketStatus = await context.db.ticketStatus.findFirstOrThrow({
      where: { id: extra.id },
    });
    expect(ticketStatus.status).toBe("ACTIVE");
    expect(errorCode({ result: await preview({ id: "unknown" }) })).toBe("NOT_FOUND");
  });
});
