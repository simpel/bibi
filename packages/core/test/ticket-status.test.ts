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
  ticketStatus.invoiceable,
];

describe("ticket statuses (ADR 0043)", () => {
  it("provisions the minimum pipeline with forward and closing transitions", async () => {
    const context = await provisionedContext();
    const all = await statuses({ context });
    expect(all.map((ticketStatus) => flagsOf(ticketStatus))).toEqual([
      ["Lead", true, false, false],
      ["Confirmed", false, false, false],
      ["Completed", false, true, true],
      ["Lost", false, true, false],
    ]);
    const ids = Object.fromEntries(all.map((ticketStatus) => [ticketStatus.name, ticketStatus.id]));
    const lead = await statusByName({ context, name: "Lead" });
    expect(lead.transitionsTo).toEqual([ids.Confirmed, ids.Completed, ids.Lost]);
    // The template's gates sit on every transition into their status (ADR 0067 §5).
    expect(lead.transitionGates).toEqual([
      { toStatusId: ids.Confirmed, gates: ["ASSIGNEE"] },
      { toStatusId: ids.Completed, gates: ["ASSIGNEE"] },
      { toStatusId: ids.Lost, gates: ["REASON"] },
    ]);
    const confirmed = await statusByName({ context, name: "Confirmed" });
    expect(confirmed.transitionsTo).toEqual([ids.Completed, ids.Lost]);
    expect((await statusByName({ context, name: "Lost" })).transitionsTo).toEqual([]);
    expect(lead.createdBy).toBe("system");
  });

  it("creates a status with a name and a colour only, placed last with no flags", async () => {
    const context = await provisionedContext();
    const input = { name: "Site visit", color: "#0d9488", entry: true, closes: true };
    const created = unwrap({
      result: await execute({ operation: createTicketStatus, input, context }),
    });
    expect(created).toMatchObject({ position: 4, entry: false, closes: false, event: null });
    expect(created.transitionsTo).toEqual([]);
    const again = await execute({ operation: createTicketStatus, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("gives the entry flag to a status set as entry, and refuses entry with closes", async () => {
    const context = await provisionedContext();
    const make = async ({ name }: { name: string }) =>
      unwrap({
        result: await execute({
          operation: createTicketStatus,
          input: { name, color: "#000000" },
          context,
        }),
      });
    const request = await make({ name: "Request" });
    const entry = { id: request.id, entry: true };
    unwrap({ result: await execute({ operation: updateTicketStatus, input: entry, context }) });
    const entries = (await statuses({ context })).filter((ticketStatus) => ticketStatus.entry);
    expect(entries.map((ticketStatus) => ticketStatus.name)).toEqual(["Request"]);
    const odd = await make({ name: "Odd" });
    const both = { id: odd.id, entry: true, closes: true };
    const refused = await execute({ operation: updateTicketStatus, input: both, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("keeps one entry status when two are set at once (CONFLICT, never INTERNAL)", async () => {
    const context = await provisionedContext();
    const make = async ({ name }: { name: string }) =>
      unwrap({
        result: await execute({
          operation: createTicketStatus,
          input: { name, color: "#000000" },
          context,
        }),
      });
    const [a, b] = [await make({ name: "A" }), await make({ name: "B" })];
    const setEntry = ({ id }: { id: string }) =>
      execute({ operation: updateTicketStatus, input: { id, entry: true }, context });
    const results = await Promise.all([setEntry({ id: a.id }), setEntry({ id: b.id })]);
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
