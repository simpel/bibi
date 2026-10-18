import { describe, expect, it } from "vitest";
import {
  archiveTicketPhase,
  createTicketPhase,
  execute,
  getTicketPhase,
  updateTicketPhase,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { phaseByName, phases, provisionedContext } from "./ticket-phase-helpers";

const flagsOf = ({ name, ...phase }: Awaited<ReturnType<typeof phaseByName>>) => [
  name,
  phase.entry,
  phase.terminal,
  phase.requiresReason,
  phase.requiresAssignee,
  phase.invoiceable,
];

describe("ticket phases (ADR 0043)", () => {
  it("provisions the minimum pipeline with forward and terminal transitions", async () => {
    const context = await provisionedContext();
    const all = await phases({ context });
    expect(all.map((phase) => flagsOf(phase))).toEqual([
      ["Lead", true, false, false, false, false],
      ["Confirmed", false, false, false, true, false],
      ["Completed", false, true, false, true, true],
      ["Lost", false, true, true, false, false],
    ]);
    const ids = Object.fromEntries(all.map((phase) => [phase.name, phase.id]));
    const lead = await phaseByName({ context, name: "Lead" });
    expect(lead.transitionsTo).toEqual([ids.Confirmed, ids.Completed, ids.Lost]);
    const confirmed = await phaseByName({ context, name: "Confirmed" });
    expect(confirmed.transitionsTo).toEqual([ids.Completed, ids.Lost]);
    expect((await phaseByName({ context, name: "Lost" })).transitionsTo).toEqual([]);
    expect(lead.createdBy).toBe("system");
  });

  it("places a new phase last, and a new entry phase takes the flag", async () => {
    const context = await provisionedContext();
    const input = { name: "Site visit", color: "#0d9488" };
    const created = unwrap({
      result: await execute({ operation: createTicketPhase, input, context }),
    });
    expect(created).toMatchObject({ position: 4, entry: false, transitionsTo: [] });
    const again = await execute({ operation: createTicketPhase, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const entry = { name: "Request", color: "#000000", entry: true };
    unwrap({ result: await execute({ operation: createTicketPhase, input: entry, context }) });
    const entries = (await phases({ context })).filter((phase) => phase.entry);
    expect(entries.map((phase) => phase.name)).toEqual(["Request"]);
    const both = { name: "Odd", color: "#000000", entry: true, terminal: true };
    const odd = await execute({ operation: createTicketPhase, input: both, context });
    expect(errorCode({ result: odd })).toBe("VALIDATION");
  });

  it("keeps one entry phase when two are made at once (CONFLICT, never INTERNAL)", async () => {
    const context = await provisionedContext();
    const make = ({ name }: { name: string }) =>
      execute({
        operation: createTicketPhase,
        input: { name, color: "#000000", entry: true },
        context,
      });
    const results = await Promise.all([make({ name: "A" }), make({ name: "B" })]);
    for (const result of results) {
      if (!result.ok) expect(result.error.code).toBe("CONFLICT");
    }
    expect((await phases({ context })).filter((phase) => phase.entry)).toHaveLength(1);
  });

  it("renames, recolors and changes flags, but keeps the minimum configuration", async () => {
    const context = await provisionedContext();
    const lead = await phaseByName({ context, name: "Lead" });
    const update = ({ input }: { input: Record<string, unknown> }) =>
      execute({ operation: updateTicketPhase, input: { id: lead.id, ...input }, context });
    const renamed = unwrap({ result: await update({ input: { name: "New", color: "#123456" } }) });
    expect(renamed).toMatchObject({ name: "New", color: "#123456", entry: true });
    expect(errorCode({ result: await update({ input: { name: "Confirmed" } }) })).toBe("CONFLICT");
    expect(errorCode({ result: await update({ input: { color: "red" } }) })).toBe("VALIDATION");
    expect(errorCode({ result: await update({ input: { entry: false } }) })).toBe("CONFLICT");
    const lost = await phaseByName({ context, name: "Lost" });
    const completed = await phaseByName({ context, name: "Completed" });
    const unset = ({ id }: { id: string }) =>
      execute({ operation: updateTicketPhase, input: { id, terminal: false }, context });
    unwrap({ result: await unset({ id: lost.id }) });
    expect(errorCode({ result: await unset({ id: completed.id }) })).toBe("CONFLICT");
    const confirmed = await phaseByName({ context, name: "Confirmed" });
    const terminal = unwrap({
      result: await execute({
        operation: updateTicketPhase,
        input: { id: confirmed.id, terminal: true },
        context,
      }),
    });
    expect(terminal.transitionsTo).toEqual([]);
  });

  it("requires ticketPhase:admin to change phases and read to list them", async () => {
    const context = await provisionedContext();
    const writer = peer({ of: context, access: "write" });
    const input = { name: "Extra", color: "#000000" };
    const denied = await execute({ operation: createTicketPhase, input, context: writer });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    expect(await phases({ context: writer })).toHaveLength(4);
  });

  it("never shows another organization's phases", async () => {
    const context = await provisionedContext();
    const other = await provisionedContext();
    const theirs = await phaseByName({ context: other, name: "Lead" });
    const read = await execute({ operation: getTicketPhase, input: { id: theirs.id }, context });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const archive = await execute({
      operation: archiveTicketPhase,
      input: { id: theirs.id },
      context,
    });
    expect(errorCode({ result: archive })).toBe("NOT_FOUND");
  });
});
