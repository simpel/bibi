import { describe, expect, it } from "vitest";
import { changeTicketStatus, createLine, execute } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { insertHold } from "./hold-helpers";
import { activeOccupancies } from "./line-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { testOrg } from "./org-helpers";
import { createTestTicket, memberUser, moveToStatus, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

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

describe("ticket.changeStatus (ADR 0043)", () => {
  it("moves along an allowed transition and audits the change", async () => {
    const { context, ticket } = await leadSetup({ assigned: true });
    const moved = unwrap({
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" }),
    });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    expect(moved).toMatchObject({ statusId: confirmed.id, statusReason: null });
    expect(moved.statusChangedAt.getTime()).toBeGreaterThanOrEqual(
      ticket.statusChangedAt.getTime(),
    );
    const audit = await context.db.auditLog.findFirstOrThrow({
      where: { entityId: ticket.id, operation: "ticket.changeStatus" },
    });
    expect(audit.before).toMatchObject({ statusId: ticket.statusId });
    expect(audit.after).toMatchObject({ statusId: confirmed.id });
  });

  it("lists every blocker of a refused move and changes nothing", async () => {
    const { context, ticket } = await leadSetup();
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const lead = await statusByName({ context, name: "Lead" });
    await context.db.ticketStatusTransition.deleteMany({
      where: { fromStatusId: lead.id, toStatusId: confirmed.id },
    });
    await context.db.ticketStatus.update({
      where: { id: confirmed.id },
      data: { requiresReason: true },
    });
    const refused = await moveToStatus({ context, ticketId: ticket.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const paths = refused.ok ? [] : refused.error.issues.map((issue) => issue.path);
    expect(paths).toEqual(["statusId", "reason", "assigneeId"]);
    const after = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(after.statusId).toBe(lead.id);
  });

  it("needs a reason for Lost and an assignee for Completed", async () => {
    const { context, ticket } = await leadSetup();
    const noReason = await moveToStatus({ context, ticketId: ticket.id, name: "Lost" });
    expect(noReason.ok ? null : noReason.error.issues.map((issue) => issue.path)).toEqual([
      "reason",
    ]);
    const noAssignee = await moveToStatus({ context, ticketId: ticket.id, name: "Completed" });
    expect(noAssignee.ok ? null : noAssignee.error.issues[0]?.path).toBe("assigneeId");
    const lost = unwrap({
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Lost", reason: "Price" }),
    });
    expect(lost.statusReason).toBe("Price");
  });

  it("never leaves a closing status, even with a stray transition row", async () => {
    const { context, ticket } = await leadSetup();
    unwrap({
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Lost", reason: "x" }),
    });
    const lost = await statusByName({ context, name: "Lost" });
    const lead = await statusByName({ context, name: "Lead" });
    await context.db.ticketStatusTransition.create({
      data: { organizationId: context.organizationId, fromStatusId: lost.id, toStatusId: lead.id },
    });
    const reopened = await moveToStatus({ context, ticketId: ticket.id, name: "Lead" });
    expect(errorCode({ result: reopened })).toBe("CONFLICT");
  });

  it("drops the line holds of a ticket that enters a closing status (ADR 0053)", async () => {
    const { context, ticket } = await leadSetup();
    const item = await createBookableItem({ context });
    // The room type has no released state, so only the closing status releases the hold.
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
      result: await moveToStatus({ context, ticketId: ticket.id, name: "Lost", reason: "Online" }),
    });
    expect(await activeOccupancies({ context, lineId: line.id })).toEqual([]);
    const kept = await context.db.occupancy.findFirst({ where: { id: other.id } });
    expect(kept?.status).toBe("ACTIVE");
  });

  it("refuses unknown and foreign ids", async () => {
    const { context, ticket } = await leadSetup();
    const other = await ticketSetup();
    const foreign = await statusByName({ context: other.context, name: "Lost" });
    type ChangeInput = { input: Record<string, unknown>; ctx?: typeof context };
    const change = ({ input, ctx = context }: ChangeInput) =>
      execute({ operation: changeTicketStatus, input, context: ctx });
    const withForeign = await change({
      input: { ticketId: ticket.id, statusId: foreign.id, reason: "x" },
    });
    expect(errorCode({ result: withForeign })).toBe("VALIDATION");
    const lost = await statusByName({ context, name: "Lost" });
    expect(
      errorCode({ result: await change({ input: { ticketId: "nope", statusId: lost.id } }) }),
    ).toBe("NOT_FOUND");
    const outside = await change({
      input: { ticketId: ticket.id, statusId: lost.id, reason: "x" },
      ctx: await testOrg(),
    });
    expect(errorCode({ result: outside })).toBe("NOT_FOUND");
    const same = await change({ input: { ticketId: ticket.id, statusId: ticket.statusId } });
    expect(errorCode({ result: same })).toBe("CONFLICT");
  });
});
