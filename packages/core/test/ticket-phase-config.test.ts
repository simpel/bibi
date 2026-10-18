import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  execute,
  importTicketPhaseTemplate,
  reorderTicketPhases,
  setTicketPhaseTransitions,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { phaseByName, phases, provisionedContext } from "./ticket-phase-helpers";

const conferenceEstate = { template: "conference-estate" };

describe("ticket phase order, transitions and templates (ADR 0043)", () => {
  it("reorders freely but needs every active phase once", async () => {
    const context = await provisionedContext();
    const ids = (await phases({ context })).map((phase) => phase.id);
    const reversed = [...ids].reverse();
    const result = unwrap({
      result: await execute({ operation: reorderTicketPhases, input: { ids: reversed }, context }),
    });
    expect(result.items.map((phase) => phase.id)).toEqual(reversed);
    const partial = await execute({
      operation: reorderTicketPhases,
      input: { ids: ids.slice(1) },
      context,
    });
    expect(errorCode({ result: partial })).toBe("VALIDATION");
  });

  it("replaces a phase's transitions as a set; terminal phases have none", async () => {
    const context = await provisionedContext();
    const lead = await phaseByName({ context, name: "Lead" });
    const completed = await phaseByName({ context, name: "Completed" });
    const set = ({ input }: { input: { id: string; toPhaseIds: string[] } }) =>
      execute({ operation: setTicketPhaseTransitions, input, context });
    const done = unwrap({
      result: await set({ input: { id: lead.id, toPhaseIds: [completed.id] } }),
    });
    expect(done.transitionsTo).toEqual([completed.id]);
    expect(
      errorCode({ result: await set({ input: { id: lead.id, toPhaseIds: [lead.id] } }) }),
    ).toBe("VALIDATION");
    const foreign = await phaseByName({ context: await provisionedContext(), name: "Confirmed" });
    expect(
      errorCode({ result: await set({ input: { id: lead.id, toPhaseIds: [foreign.id] } }) }),
    ).toBe("VALIDATION");
    expect(
      errorCode({ result: await set({ input: { id: completed.id, toPhaseIds: [lead.id] } }) }),
    ).toBe("VALIDATION");
    unwrap({ result: await set({ input: { id: lead.id, toPhaseIds: [] } }) });
    expect((await phaseByName({ context, name: "Lead" })).transitionsTo).toEqual([]);
  });

  it("imports a template next to existing phases, keeps the entry phase, idempotently", async () => {
    const context = await provisionedContext();
    const first = unwrap({
      result: await execute({
        operation: importTicketPhaseTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(first.created.map((phase) => phase.name)).toEqual([
      "New",
      "Site visit",
      "Quote sent",
      "Final count locked",
      "Cancelled",
    ]);
    expect(first.skipped).toEqual(["Confirmed", "Completed", "Lost"]);
    const entries = (await phases({ context })).filter((phase) => phase.entry);
    expect(entries.map((phase) => phase.name)).toEqual(["Lead"]);
    const second = unwrap({
      result: await execute({
        operation: importTicketPhaseTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(second).toMatchObject({ created: [], transitionsAdded: 0 });
  });

  it("imports into an empty organization and audits every change as a ticketPhase", async () => {
    const context = testContext();
    const result = unwrap({
      result: await execute({
        operation: importTicketPhaseTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(result.created).toHaveLength(8);
    expect(result.created[0]).toMatchObject({ name: "New", entry: true });
    expect(result.transitionsAdded).toBe(25);
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "ticketPhase.importTemplate" },
    });
    expect(new Set(audit.map((row) => row.entityType))).toEqual(new Set(["ticketPhase"]));
    expect(audit.length).toBeGreaterThanOrEqual(5);
  });
});
