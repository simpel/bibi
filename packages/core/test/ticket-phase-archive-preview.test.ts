import { describe, expect, it } from "vitest";
import { createTicketPhase, execute, previewArchiveTicketPhase } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

describe("ticketPhase.archivePreview (ADR 0043)", () => {
  it("counts the tickets that move and lists blockers without changing anything", async () => {
    const { context, type, customer } = await ticketSetup();
    const extra = unwrap({
      result: await execute({
        operation: createTicketPhase,
        input: { name: "Site visit", color: "#0d9488" },
        context,
      }),
    });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await context.db.ticket.update({ where: { id: ticket.id }, data: { phaseId: extra.id } });
    const preview = ({ ...input }: { id: string; targetPhaseId?: string }) =>
      execute({ operation: previewArchiveTicketPhase, input, context });
    const noTarget = unwrap({ result: await preview({ id: extra.id }) });
    expect(noTarget).toMatchObject({ archivable: false, moving: 1, targetRequired: true });
    expect(noTarget.blockers.length).toBeGreaterThan(0);
    const lost = await phaseByName({ context, name: "Lost" });
    const blocked = unwrap({ result: await preview({ id: extra.id, targetPhaseId: lost.id }) });
    expect(blocked).toMatchObject({ archivable: false, moving: 1 });
    const lead = await phaseByName({ context, name: "Lead" });
    const entry = unwrap({ result: await preview({ id: lead.id }) });
    expect(entry.archivable).toBe(false);
    const row = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(row.phaseId).toBe(extra.id);
    const phase = await context.db.ticketPhase.findFirstOrThrow({ where: { id: extra.id } });
    expect(phase.status).toBe("ACTIVE");
    expect(errorCode({ result: await preview({ id: "unknown" }) })).toBe("NOT_FOUND");
  });
});
