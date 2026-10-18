import { describe, expect, it } from "vitest";
import {
  archiveTicketPhase,
  createTicketPhase,
  execute,
  setTicketPhaseTransitions,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

describe("ticketPhase.archive (ADR 0043)", () => {
  it("keeps the last entry and terminal phase", async () => {
    const { context } = await ticketSetup();
    const lead = await phaseByName({ context, name: "Lead" });
    const refused = await execute({
      operation: archiveTicketPhase,
      input: { id: lead.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const lost = await phaseByName({ context, name: "Lost" });
    unwrap({
      result: await execute({ operation: archiveTicketPhase, input: { id: lost.id }, context }),
    });
    const completed = await phaseByName({ context, name: "Completed" });
    const last = await execute({
      operation: archiveTicketPhase,
      input: { id: completed.id },
      context,
    });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const confirmed = await phaseByName({ context, name: "Confirmed" });
    expect(confirmed.transitionsTo).not.toContain(lost.id);
  });

  it("keeps a terminal phase when the last two are archived at once", async () => {
    const { context } = await ticketSetup();
    const ids = [
      (await phaseByName({ context, name: "Completed" })).id,
      (await phaseByName({ context, name: "Lost" })).id,
    ];
    const results = await Promise.all(
      ids.map((id) => execute({ operation: archiveTicketPhase, input: { id }, context })),
    );
    expect(results.map((result) => (result.ok ? "ok" : result.error.code)).sort()).toEqual([
      "CONFLICT",
      "ok",
    ]);
  });

  it("moves the phase's tickets to a target through the normal checks, all or none", async () => {
    const { context, type, customer } = await ticketSetup();
    const extra = unwrap({
      result: await execute({
        operation: createTicketPhase,
        input: { name: "Site visit", color: "#0d9488" },
        context,
      }),
    });
    const lead = await phaseByName({ context, name: "Lead" });
    const ids = [...lead.transitionsTo, extra.id];
    const input = { id: lead.id, toPhaseIds: ids };
    unwrap({ result: await execute({ operation: setTicketPhaseTransitions, input, context }) });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await context.db.ticket.update({ where: { id: ticket.id }, data: { phaseId: extra.id } });
    const archive = ({ rest }: { rest: Record<string, unknown> }) =>
      execute({ operation: archiveTicketPhase, input: { id: extra.id, ...rest }, context });
    const noTarget = await archive({ rest: {} });
    expect(noTarget.ok ? null : noTarget.error.issues[0]?.path).toBe("targetPhaseId");
    const foreign = await phaseByName({ context: (await ticketSetup()).context, name: "Lost" });
    const elsewhere = await archive({ rest: { targetPhaseId: foreign.id } });
    expect(elsewhere.ok ? null : elsewhere.error.issues[0]?.path).toBe("targetPhaseId");
    const lost = await phaseByName({ context, name: "Lost" });
    const blocked = await archive({ rest: { targetPhaseId: lost.id } });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    const kept = await context.db.ticketPhase.findFirstOrThrow({ where: { id: extra.id } });
    expect(kept.status).toBe("ACTIVE");
    await context.db.ticketPhaseTransition.create({
      data: { organizationId: context.organizationId, fromPhaseId: extra.id, toPhaseId: lost.id },
    });
    const archived = unwrap({
      result: await archive({ rest: { targetPhaseId: lost.id, reason: "Merged" } }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", transitionsTo: [] });
    const moved = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(moved).toMatchObject({ phaseId: lost.id, phaseReason: "Merged" });
  });
});
