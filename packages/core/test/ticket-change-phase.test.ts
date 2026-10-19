import { describe, expect, it } from "vitest";
import { changeTicketPhase, createLine, execute } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { insertHold } from "./hold-helpers";
import { activeOccupancies } from "./line-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { testOrg } from "./org-helpers";
import { createTestTicket, memberUser, moveToPhase, ticketSetup } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

async function leadSetup({ assigned = false }: { assigned?: boolean } = {}) {
  const setup = await ticketSetup();
  const { context, type, customer } = setup;
  const assigneeId = assigned ? await memberUser({ context, name: "Johan Ek" }) : undefined;
  const ticket = await createTestTicket({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
    ...(assigneeId ? { assigneeId } : {}),
  });
  return { ...setup, ticket };
}

describe("ticket.changePhase (ADR 0043)", () => {
  it("moves along an allowed transition and audits the change", async () => {
    const { context, ticket } = await leadSetup({ assigned: true });
    const moved = unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" }),
    });
    const confirmed = await phaseByName({ context, name: "Confirmed" });
    expect(moved).toMatchObject({ phaseId: confirmed.id, phaseReason: null });
    expect(moved.phaseChangedAt.getTime()).toBeGreaterThanOrEqual(ticket.phaseChangedAt.getTime());
    const audit = await context.db.auditLog.findFirstOrThrow({
      where: { entityId: ticket.id, operation: "ticket.changePhase" },
    });
    expect(audit.before).toMatchObject({ phaseId: ticket.phaseId });
    expect(audit.after).toMatchObject({ phaseId: confirmed.id });
  });

  it("lists every blocker of a refused move and changes nothing", async () => {
    const { context, ticket } = await leadSetup();
    const confirmed = await phaseByName({ context, name: "Confirmed" });
    const lead = await phaseByName({ context, name: "Lead" });
    await context.db.ticketPhaseTransition.deleteMany({
      where: { fromPhaseId: lead.id, toPhaseId: confirmed.id },
    });
    await context.db.ticketPhase.update({
      where: { id: confirmed.id },
      data: { requiresReason: true },
    });
    const refused = await moveToPhase({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const paths = refused.ok ? [] : refused.error.issues.map((issue) => issue.path);
    expect(paths).toEqual(["phaseId", "reason", "assigneeId"]);
    const after = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(after.phaseId).toBe(lead.id);
  });

  it("needs a reason for Lost and an assignee for Completed", async () => {
    const { context, ticket } = await leadSetup();
    const noReason = await moveToPhase({ context, ticketId: ticket.id, name: "Lost" });
    expect(noReason.ok ? null : noReason.error.issues.map((issue) => issue.path)).toEqual([
      "reason",
    ]);
    const noAssignee = await moveToPhase({ context, ticketId: ticket.id, name: "Completed" });
    expect(noAssignee.ok ? null : noAssignee.error.issues[0]?.path).toBe("assigneeId");
    const lost = unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Lost", reason: "Price" }),
    });
    expect(lost.phaseReason).toBe("Price");
  });

  it("never leaves a terminal phase, even with a stray transition row", async () => {
    const { context, ticket } = await leadSetup();
    unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Lost", reason: "x" }),
    });
    const lost = await phaseByName({ context, name: "Lost" });
    const lead = await phaseByName({ context, name: "Lead" });
    await context.db.ticketPhaseTransition.create({
      data: { organizationId: context.organizationId, fromPhaseId: lost.id, toPhaseId: lead.id },
    });
    const reopened = await moveToPhase({ context, ticketId: ticket.id, name: "Lead" });
    expect(errorCode({ result: reopened })).toBe("CONFLICT");
  });

  it("drops the line holds of a ticket that enters a terminal phase (ADR 0053)", async () => {
    const { context, ticket } = await leadSetup();
    const item = await createBookableItem({ context });
    // The room type has no released state, so only the terminal phase releases the hold.
    const other = await insertHold({ context, itemId: item.id, hold: "SOFT", from: 9, to: 12 });
    const lineType = await context.db.entityType.findFirstOrThrow({ where: { base: "LINE" } });
    const input = { ticketId: ticket.id, entityTypeId: lineType.id, itemId: item.id, name: "Talk" };
    const line = unwrap({
      result: await execute({
        operation: createLine,
        input: { ...input, ...hours({ from: 13, to: 15 }) },
        context,
      }),
    });
    expect(await activeOccupancies({ context, lineId: line.id })).toHaveLength(1);
    unwrap({
      result: await moveToPhase({ context, ticketId: ticket.id, name: "Lost", reason: "Online" }),
    });
    expect(await activeOccupancies({ context, lineId: line.id })).toEqual([]);
    const kept = await context.db.occupancy.findFirst({ where: { id: other.id } });
    expect(kept?.status).toBe("ACTIVE");
  });

  it("refuses unknown and foreign ids", async () => {
    const { context, ticket } = await leadSetup();
    const other = await ticketSetup();
    const foreign = await phaseByName({ context: other.context, name: "Lost" });
    type ChangeInput = { input: Record<string, unknown>; ctx?: typeof context };
    const change = ({ input, ctx = context }: ChangeInput) =>
      execute({ operation: changeTicketPhase, input, context: ctx });
    const withForeign = await change({
      input: { ticketId: ticket.id, phaseId: foreign.id, reason: "x" },
    });
    expect(errorCode({ result: withForeign })).toBe("VALIDATION");
    const lost = await phaseByName({ context, name: "Lost" });
    expect(
      errorCode({ result: await change({ input: { ticketId: "nope", phaseId: lost.id } }) }),
    ).toBe("NOT_FOUND");
    const outside = await change({
      input: { ticketId: ticket.id, phaseId: lost.id, reason: "x" },
      ctx: await testOrg(),
    });
    expect(errorCode({ result: outside })).toBe("NOT_FOUND");
    const same = await change({ input: { ticketId: ticket.id, phaseId: ticket.phaseId } });
    expect(errorCode({ result: same })).toBe("CONFLICT");
  });
});
