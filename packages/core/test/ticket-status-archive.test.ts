import { describe, expect, it } from "vitest";
import {
  archiveTicketStatus,
  createTicketStatus,
  execute,
  setTicketStatusTransitions,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestTicket, placeInStatus, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("ticketStatus.archive (ADR 0043)", () => {
  it("keeps the last entry and closing status", async () => {
    const { context } = await ticketSetup();
    const lead = await statusByName({ context, name: "Lead" });
    const refused = await execute({
      operation: archiveTicketStatus,
      input: { id: lead.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const lost = await statusByName({ context, name: "Lost" });
    unwrap({
      result: await execute({ operation: archiveTicketStatus, input: { id: lost.id }, context }),
    });
    const completed = await statusByName({ context, name: "Completed" });
    const last = await execute({
      operation: archiveTicketStatus,
      input: { id: completed.id },
      context,
    });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const confirmed = await statusByName({ context, name: "Confirmed" });
    expect(confirmed.transitionsTo).not.toContain(lost.id);
  });

  it("keeps a closing status when the last two are archived at once", async () => {
    const { context } = await ticketSetup();
    const ids = [
      (await statusByName({ context, name: "Completed" })).id,
      (await statusByName({ context, name: "Lost" })).id,
    ];
    const results = await Promise.all(
      ids.map((id) => execute({ operation: archiveTicketStatus, input: { id }, context })),
    );
    expect(results.map((result) => (result.ok ? "ok" : result.error.code)).sort()).toEqual([
      "CONFLICT",
      "ok",
    ]);
  });

  it("moves the status's tickets to a target through the normal checks, all or none", async () => {
    const { context, type, customer } = await ticketSetup();
    const extra = unwrap({
      result: await execute({
        operation: createTicketStatus,
        input: { name: "Site visit", color: "#0d9488" },
        context,
      }),
    });
    const lead = await statusByName({ context, name: "Lead" });
    const ids = [...lead.transitionsTo, extra.id];
    const input = { id: lead.id, toStatusIds: ids };
    unwrap({ result: await execute({ operation: setTicketStatusTransitions, input, context }) });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await placeInStatus({ ticket, statusId: extra.id });
    const archive = ({ rest }: { rest: Record<string, unknown> }) =>
      execute({ operation: archiveTicketStatus, input: { id: extra.id, ...rest }, context });
    const noTarget = await archive({ rest: {} });
    expect(noTarget.ok ? null : noTarget.error.issues[0]?.path).toBe("targetStatusId");
    const foreign = await statusByName({ context: (await ticketSetup()).context, name: "Lost" });
    const elsewhere = await archive({ rest: { targetStatusId: foreign.id } });
    expect(elsewhere.ok ? null : elsewhere.error.issues[0]?.path).toBe("targetStatusId");
    const lost = await statusByName({ context, name: "Lost" });
    const blocked = await archive({ rest: { targetStatusId: lost.id } });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    const kept = await context.db.ticketStatus.findFirstOrThrow({ where: { id: extra.id } });
    expect(kept.status).toBe("ACTIVE");
    await context.db.ticketStatusTransition.create({
      data: { organizationId: context.organizationId, fromStatusId: extra.id, toStatusId: lost.id },
    });
    const archived = unwrap({
      result: await archive({ rest: { targetStatusId: lost.id, reason: "Merged" } }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", transitionsTo: [] });
    const moved = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(moved.statusId).toBe(lost.id);
    const change = await context.db.ticketStatusChange.findFirstOrThrow({
      where: { ticketId: ticket.id },
      orderBy: { seq: "desc" },
    });
    expect(change).toMatchObject({ toStatusId: lost.id, reason: "Merged", trigger: "SYSTEM" });
  });
});
