import { describe, expect, it } from "vitest";
import { activatePipelineSetup, execute, previewPipelineSetup } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { estateDraft, roomType } from "./pipeline-setup-helpers";
import { phases, provisionedContext } from "./ticket-phase-helpers";

describe("pipelineSetup.activate (ADR 0044)", () => {
  it("creates the previewed pipeline as one audited batch", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const input = estateDraft({ roomTypeId: room.id });
    const result = unwrap({
      result: await execute({ operation: activatePipelineSetup, input, context }),
    });
    expect(result.phases.map((phase) => phase.name)).toEqual(input.phases.map((p) => p.name));
    const roomStates = result.states.filter((state) => state.entityTypeId === room.id);
    expect(roomStates.map((state) => state.name)).toEqual(["Prebooked", "Booked", "Released"]);
    expect(roomStates[0]).toMatchObject({ initial: true, hold: "SOFT", expires: true });
    const type = await context.db.entityType.findFirstOrThrow({ where: { id: room.id } });
    expect(type.expiryStateId).toBe(roomStates[2]?.id);
    expect(await context.db.itemState.count({ where: { name: "Active" } })).toBe(0);
    const cells = result.grid.cells.map((c) => `${c.phaseName}:${c.entityTypeName}:${c.stateName}`);
    expect(cells).toEqual(expect.arrayContaining(["New:Room:Prebooked", "Confirmed:Dish:Ordered"]));
    expect(cells).toHaveLength(input.cells.length);
    const newPhase = result.phases[0];
    expect(newPhase?.entry).toBe(true);
    expect(newPhase?.transitionsTo).toHaveLength(input.phases.length - 1);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "pipelineSetup.activate" },
    });
    const types = new Set(audit.map((row) => row.entityType));
    expect(types).toEqual(new Set(["entityType", "itemState", "ticketPhase", "phaseStateRule"]));
  });

  it("replaces a provisioned pipeline: other phases are archived, same names updated", async () => {
    const context = await provisionedContext();
    const before = await phases({ context });
    const input = estateDraft();
    unwrap({ result: await execute({ operation: activatePipelineSetup, input, context }) });
    const after = await phases({ context });
    expect(after.map((phase) => phase.name)).toEqual(input.phases.map((phase) => phase.name));
    const confirmed = before.find((phase) => phase.name === "Confirmed");
    expect(after.find((phase) => phase.name === "Confirmed")?.id).toBe(confirmed?.id);
    expect(after.filter((phase) => phase.entry).map((phase) => phase.name)).toEqual(["New"]);
  });

  it("refuses a draft whose preview has errors and writes nothing", async () => {
    const context = testContext();
    const draft = estateDraft();
    const input = { ...draft, phases: draft.phases.filter((phase) => !phase.terminal) };
    const preview = unwrap({
      result: await execute({ operation: previewPipelineSetup, input, context }),
    });
    expect(preview.ready).toBe(false);
    const refused = await execute({ operation: activatePipelineSetup, input, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    expect(await context.db.ticketPhase.count()).toBe(0);
    expect(await context.db.entityType.count()).toBe(0);
  });

  it("rolls the whole batch back when one step fails", async () => {
    const context = testContext();
    await roomType({ context });
    const refused = await execute({
      operation: activatePipelineSetup,
      input: estateDraft(),
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(await context.db.ticketPhase.count()).toBe(0);
    expect(await context.db.entityType.count({ where: { name: "Dish" } })).toBe(0);
    expect(
      await context.db.auditLog.count({ where: { operation: "pipelineSetup.activate" } }),
    ).toBe(0);
  });

  it("needs admin on every part it changes", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const input = estateDraft({ roomTypeId: room.id });
    const all = context.permissions;
    const noPhases = { ...context, permissions: { ...all, ticketPhase: ["read" as const] } };
    const refused = await execute({ operation: activatePipelineSetup, input, context: noPhases });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
    expect(await context.db.ticketPhase.count()).toBe(0);
    const foreign = await execute({
      operation: activatePipelineSetup,
      input,
      context: testContext(),
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
  });
});
