import { describe, expect, it } from "vitest";
import {
  archiveTicketStatus,
  createTicketStatus,
  execute,
  getTicketStatus,
  updateTicketStatus,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { provisionedContext, statusByName, statuses } from "./ticket-status-helpers";

const flagsOf = ({ name, ...ticketStatus }: Awaited<ReturnType<typeof statusByName>>) => [
  name,
  ticketStatus.entry,
  ticketStatus.closes,
  ticketStatus.requiresReason,
  ticketStatus.requiresAssignee,
  ticketStatus.invoiceable,
];

describe("ticket statuses (ADR 0043)", () => {
  it("provisions the minimum pipeline with forward and closing transitions", async () => {
    const context = await provisionedContext();
    const all = await statuses({ context });
    expect(all.map((ticketStatus) => flagsOf(ticketStatus))).toEqual([
      ["Lead", true, false, false, false, false],
      ["Confirmed", false, false, false, true, false],
      ["Completed", false, true, false, true, true],
      ["Lost", false, true, true, false, false],
    ]);
    const ids = Object.fromEntries(all.map((ticketStatus) => [ticketStatus.name, ticketStatus.id]));
    const lead = await statusByName({ context, name: "Lead" });
    expect(lead.transitionsTo).toEqual([ids.Confirmed, ids.Completed, ids.Lost]);
    const confirmed = await statusByName({ context, name: "Confirmed" });
    expect(confirmed.transitionsTo).toEqual([ids.Completed, ids.Lost]);
    expect((await statusByName({ context, name: "Lost" })).transitionsTo).toEqual([]);
    expect(lead.createdBy).toBe("system");
  });

  it("places a new status last, and a new entry status takes the flag", async () => {
    const context = await provisionedContext();
    const input = { name: "Site visit", color: "#0d9488" };
    const created = unwrap({
      result: await execute({ operation: createTicketStatus, input, context }),
    });
    expect(created).toMatchObject({ position: 4, entry: false, transitionsTo: [] });
    const again = await execute({ operation: createTicketStatus, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const entry = { name: "Request", color: "#000000", entry: true };
    unwrap({ result: await execute({ operation: createTicketStatus, input: entry, context }) });
    const entries = (await statuses({ context })).filter((ticketStatus) => ticketStatus.entry);
    expect(entries.map((ticketStatus) => ticketStatus.name)).toEqual(["Request"]);
    const both = { name: "Odd", color: "#000000", entry: true, closes: true };
    const odd = await execute({ operation: createTicketStatus, input: both, context });
    expect(errorCode({ result: odd })).toBe("VALIDATION");
  });

  it("keeps one entry status when two are made at once (CONFLICT, never INTERNAL)", async () => {
    const context = await provisionedContext();
    const make = ({ name }: { name: string }) =>
      execute({
        operation: createTicketStatus,
        input: { name, color: "#000000", entry: true },
        context,
      });
    const results = await Promise.all([make({ name: "A" }), make({ name: "B" })]);
    for (const result of results) {
      if (!result.ok) expect(result.error.code).toBe("CONFLICT");
    }
    expect((await statuses({ context })).filter((ticketStatus) => ticketStatus.entry)).toHaveLength(
      1,
    );
  });

  it("renames, recolors and changes flags, but keeps the minimum configuration", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const update = ({ input }: { input: Record<string, unknown> }) =>
      execute({ operation: updateTicketStatus, input: { id: lead.id, ...input }, context });
    const renamed = unwrap({ result: await update({ input: { name: "New", color: "#123456" } }) });
    expect(renamed).toMatchObject({ name: "New", color: "#123456", entry: true });
    expect(errorCode({ result: await update({ input: { name: "Confirmed" } }) })).toBe("CONFLICT");
    expect(errorCode({ result: await update({ input: { color: "red" } }) })).toBe("VALIDATION");
    expect(errorCode({ result: await update({ input: { entry: false } }) })).toBe("CONFLICT");
    const lost = await statusByName({ context, name: "Lost" });
    const completed = await statusByName({ context, name: "Completed" });
    const unset = ({ id }: { id: string }) =>
      execute({ operation: updateTicketStatus, input: { id, closes: false }, context });
    unwrap({ result: await unset({ id: lost.id }) });
    expect(errorCode({ result: await unset({ id: completed.id }) })).toBe("CONFLICT");
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const closes = unwrap({
      result: await execute({
        operation: updateTicketStatus,
        input: { id: confirmed.id, closes: true },
        context,
      }),
    });
    expect(closes.transitionsTo).toEqual([]);
  });

  it("requires ticketStatus:admin to change statuses and read to list them", async () => {
    const context = await provisionedContext();
    const writer = peer({ of: context, access: "write" });
    const input = { name: "Extra", color: "#000000" };
    const denied = await execute({ operation: createTicketStatus, input, context: writer });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    expect(await statuses({ context: writer })).toHaveLength(4);
  });

  it("never shows another organization's statuses", async () => {
    const context = await provisionedContext();
    const other = await provisionedContext();
    const theirs = await statusByName({ context: other, name: "Lead" });
    const read = await execute({ operation: getTicketStatus, input: { id: theirs.id }, context });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const archive = await execute({
      operation: archiveTicketStatus,
      input: { id: theirs.id },
      context,
    });
    expect(errorCode({ result: archive })).toBe("NOT_FOUND");
  });
});
