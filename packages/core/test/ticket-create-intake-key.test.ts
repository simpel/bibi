import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import {
  createSetup,
  createWith,
  linesOf,
  roomLine,
  runCreate,
  ticketCount,
  ticketInput,
} from "./ticket-create-helpers";
import { statusByName } from "./ticket-status-helpers";
import { makeTemplate } from "./ticket-template-helpers";

describe("ticket.create: provenance and idempotency (ADR 0081 decisions 8, 9, 11)", () => {
  it("records a template as the TEMPLATE trigger but starts in the entry status", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    const lines = [roomLine({ setup, from: 9, to: 11 })];
    const ticket = unwrap({
      result: await createWith({ setup, input: { templateId: template.id, lines } }),
    });
    const lead = await statusByName({ context, name: "Lead" });
    expect(ticket.statusId).toBe(lead.id);
    const history = await context.db.ticketStatusChange.findMany({
      where: { ticketId: ticket.id },
    });
    expect(history.map((row) => [row.toStatusId, row.trigger])).toEqual([[lead.id, "TEMPLATE"]]);
    // The template's own lines are not applied: only the reviewed one is created.
    expect((await linesOf({ context, ticketId: ticket.id })).length).toBe(1);
  });

  it("refuses an unknown template at templateId", async () => {
    const setup = await createSetup();
    const result = await createWith({ setup, input: { templateId: "no-such-template" } });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual(["templateId"]);
  });

  it("returns the first ticket for a repeated intakeKey and creates nothing more", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const input = { intakeKey: "intake-1", lines: [roomLine({ setup, from: 9, to: 11 })] };
    const first = unwrap({ result: await createWith({ setup, input }) });
    const before = await ticketCount({ context });
    const lineAudits = () => context.db.auditLog.count({ where: { entityType: "line" } });
    const audited = await lineAudits();
    const again = unwrap({ result: await createWith({ setup, input }) });
    expect(again.id).toBe(first.id);
    expect(await ticketCount({ context })).toBe(before);
    expect((await linesOf({ context, ticketId: first.id })).length).toBe(1);
    expect(await lineAudits()).toBe(audited);
  });

  it("creates one ticket for a concurrent pair with the same intakeKey", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const before = await ticketCount({ context });
    const input = ticketInput({
      setup,
      input: { intakeKey: "intake-race", lines: [roomLine({ setup, from: 9, to: 11 })] },
    });
    const [a, b] = await Promise.all([
      runCreate({ context, input }),
      runCreate({ context, input }),
    ]);
    expect([errorCode({ result: a }), errorCode({ result: b })]).toEqual([null, null]);
    expect(unwrap({ result: a }).id).toBe(unwrap({ result: b }).id);
    expect(await ticketCount({ context })).toBe(before + 1);
  });

  it("keeps keys per organization and lets other keys create their own tickets", async () => {
    const setup = await createSetup();
    const one = unwrap({ result: await createWith({ setup, input: { intakeKey: "k-1" } }) });
    const two = unwrap({ result: await createWith({ setup, input: { intakeKey: "k-2" } }) });
    expect(two.id).not.toBe(one.id);
    const other = await createSetup();
    const elsewhere = unwrap({
      result: await createWith({ setup: other, input: { intakeKey: "k-1" } }),
    });
    expect(elsewhere.id).not.toBe(one.id);
  });
});
