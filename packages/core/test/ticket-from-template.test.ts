import { describe, expect, it } from "vitest";
import { createTicketFromTemplate, execute } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { addLine } from "./phase-grid-helpers";
import { memberUser } from "./ticket-helpers";
import { makeTemplate, templateSetup } from "./ticket-template-helpers";

const startsAt = new Date(Date.UTC(2026, 10, 1, 9));

describe("ticket.createFromTemplate (ADR 0043)", () => {
  it("creates the ticket in the template's phase with its lines in the grid's states", async () => {
    const setup = await templateSetup();
    const { context, room, roomState, food } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    const customerId = (await setup.newTicket()).customerId;
    const assigneeId = await memberUser({ context, name: "Eva Lind" });
    const ticket = unwrap({
      result: await execute({
        operation: createTicketFromTemplate,
        input: { templateId: template.id, customerId, startsAt, quantity: 8, assigneeId },
        context,
      }),
    });
    expect(ticket).toMatchObject({ phaseId: setup.confirmed.id, quantity: 8, customerId });
    expect(ticket.desiredEndsAt?.toISOString()).toBe("2026-11-01T11:00:00.000Z");
    const lines = await context.db.programItem.findMany({
      where: { ticketId: ticket.id },
      orderBy: { startsAt: "asc" },
    });
    expect(lines.map((line) => [line.name, line.stateId, line.quantity])).toEqual([
      ["Meeting room", roomState.booked.id, null],
      ["Coffee", food.locked.id, 8],
    ]);
    expect(lines[1]?.startsAt.toISOString()).toBe("2026-11-01T09:30:00.000Z");
    expect(room.id).toBe(lines[0]?.itemId);
  });

  it("refuses the whole creation and lists the blocking line when a hard hold collides", async () => {
    const setup = await templateSetup();
    const { context, room, roomState } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    const other = await setup.newTicket();
    const holder = await addLine({ setup, ticketId: other.id, itemId: room.id, from: 10 });
    unwrap({ result: await toState({ context, lineId: holder.id, stateId: roomState.booked.id }) });
    const before = await context.db.ticket.count();
    const assigneeId = await memberUser({ context, name: "Eva Lind" });
    const refused = await execute({
      operation: createTicketFromTemplate,
      input: {
        templateId: template.id,
        customerId: other.customerId,
        startsAt,
        quantity: 8,
        assigneeId,
      },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const issues = refused.ok ? [] : refused.error.issues;
    expect(issues.map((issue) => issue.path)).toEqual(["lines.0"]);
    expect(issues[0]?.message).toContain(`ticket #${other.reference}`);
    expect(await context.db.ticket.count()).toBe(before);
  });

  it("needs an assignee when the start phase requires one and creates nothing without", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    const customerId = (await setup.newTicket()).customerId;
    const before = await context.db.ticket.count();
    const refused = await execute({
      operation: createTicketFromTemplate,
      input: { templateId: template.id, customerId, startsAt, quantity: 8 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(await context.db.ticket.count()).toBe(before);
  });

  it("needs read access to the template and customer", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    const customerId = (await setup.newTicket()).customerId;
    const writer = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["view", "create", "edit", "remove"], customer: ["view"] },
    });
    const refused = await execute({
      operation: createTicketFromTemplate,
      input: { templateId: template.id, customerId, startsAt, quantity: 8 },
      context: writer,
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });
});
