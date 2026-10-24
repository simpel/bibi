import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  execute,
  importTicketStatusTemplate,
  reorderTicketStatuses,
  setTicketStatusTransitions,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { provisionedContext, statusByName, statuses } from "./ticket-status-helpers";

const conferenceEstate = { template: "conference-estate" };

describe("ticket status order, transitions and templates (ADR 0043)", () => {
  it("reorders freely but needs every active status once", async () => {
    const context = await provisionedContext();
    const ids = (await statuses({ context })).map((ticketStatus) => ticketStatus.id);
    const reversed = [...ids].reverse();
    const result = unwrap({
      result: await execute({
        operation: reorderTicketStatuses,
        input: { ids: reversed },
        context,
      }),
    });
    expect(result.items.map((ticketStatus) => ticketStatus.id)).toEqual(reversed);
    const partial = await execute({
      operation: reorderTicketStatuses,
      input: { ids: ids.slice(1) },
      context,
    });
    expect(errorCode({ result: partial })).toBe("VALIDATION");
  });

  it("replaces a status's transitions as a set; closing statuses have none", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const completed = await statusByName({ context, name: "Completed" });
    const set = ({ input }: { input: { id: string; toStatusIds: string[] } }) =>
      execute({ operation: setTicketStatusTransitions, input, context });
    const done = unwrap({
      result: await set({ input: { id: lead.id, toStatusIds: [completed.id] } }),
    });
    expect(done.transitionsTo).toEqual([completed.id]);
    expect(
      errorCode({ result: await set({ input: { id: lead.id, toStatusIds: [lead.id] } }) }),
    ).toBe("VALIDATION");
    const foreign = await statusByName({ context: await provisionedContext(), name: "Confirmed" });
    expect(
      errorCode({ result: await set({ input: { id: lead.id, toStatusIds: [foreign.id] } }) }),
    ).toBe("VALIDATION");
    expect(
      errorCode({ result: await set({ input: { id: completed.id, toStatusIds: [lead.id] } }) }),
    ).toBe("VALIDATION");
    unwrap({ result: await set({ input: { id: lead.id, toStatusIds: [] } }) });
    expect((await statusByName({ context, name: "Lead" })).transitionsTo).toEqual([]);
  });

  it("imports a template next to existing statuses, keeps the entry status, idempotently", async () => {
    const context = await provisionedContext();
    const first = unwrap({
      result: await execute({
        operation: importTicketStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(first.created.map((ticketStatus) => ticketStatus.name)).toEqual([
      "New",
      "Site visit",
      "Quote sent",
      "Final count locked",
      "Cancelled",
    ]);
    expect(first.skipped).toEqual(["Confirmed", "Completed", "Lost"]);
    const entries = (await statuses({ context })).filter((ticketStatus) => ticketStatus.entry);
    expect(entries.map((ticketStatus) => ticketStatus.name)).toEqual(["Lead"]);
    const second = unwrap({
      result: await execute({
        operation: importTicketStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(second).toMatchObject({ created: [], transitionsAdded: 0 });
  });

  it("imports into an empty organization and audits every change as a ticketStatus", async () => {
    const context = testContext();
    const result = unwrap({
      result: await execute({
        operation: importTicketStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(result.created).toHaveLength(8);
    expect(result.created[0]).toMatchObject({ name: "New", entry: true });
    expect(result.transitionsAdded).toBe(25);
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "ticketStatus.importTemplate" },
    });
    expect(new Set(audit.map((row) => row.entityType))).toEqual(new Set(["ticketStatus"]));
    expect(audit.length).toBeGreaterThanOrEqual(5);
  });
});
