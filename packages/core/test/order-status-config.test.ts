import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  execute,
  importOrderStatusTemplate,
  reorderOrderStatuses,
  setOrderStatusTransitions,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { provisionedContext, statusByName, statuses } from "./order-status-helpers";

const conferenceEstate = { template: "conference-estate" };

describe("order status order, transitions and templates (ADR 0043)", () => {
  it("reorders freely but needs every active status once", async () => {
    const context = await provisionedContext();
    const ids = (await statuses({ context })).map((orderStatus) => orderStatus.id);
    const reversed = [...ids].reverse();
    const result = unwrap({
      result: await execute({
        operation: reorderOrderStatuses,
        input: { ids: reversed },
        context,
      }),
    });
    expect(result.items.map((orderStatus) => orderStatus.id)).toEqual(reversed);
    const partial = await execute({
      operation: reorderOrderStatuses,
      input: { ids: ids.slice(1) },
      context,
    });
    expect(errorCode({ result: partial })).toBe("VALIDATION");
  });

  it("lets orders move anywhere until a status restricts its moves; closing statuses have none", async () => {
    const context = await provisionedContext();
    const lead = await statusByName({ context, name: "Lead" });
    const completed = await statusByName({ context, name: "Completed" });
    expect(lead.restrictsNext).toBe(false);
    expect(lead.transitionsTo).toHaveLength(3);
    const set = ({ input }: { input: Input }) =>
      execute({ operation: setOrderStatusTransitions, input, context });
    type Input = { id: string; allowedNext: "ANY" | "ONLY_THESE"; toStatusIds?: string[] };
    const only = ({ id, to }: { id: string; to: string[] }): Input => ({
      id,
      allowedNext: "ONLY_THESE",
      toStatusIds: to,
    });
    const done = unwrap({
      result: await set({ input: only({ id: lead.id, to: [completed.id] }) }),
    });
    expect(done).toMatchObject({ restrictsNext: true, transitionsTo: [completed.id] });
    expect(errorCode({ result: await set({ input: only({ id: lead.id, to: [lead.id] }) }) })).toBe(
      "VALIDATION",
    );
    const foreign = await statusByName({ context: await provisionedContext(), name: "Confirmed" });
    expect(errorCode({ result: await set({ input: only({ id: foreign.id, to: [] }) }) })).toBe(
      "NOT_FOUND",
    );
    expect(
      errorCode({ result: await set({ input: only({ id: lead.id, to: [foreign.id] }) }) }),
    ).toBe("VALIDATION");
    expect(
      errorCode({ result: await set({ input: only({ id: completed.id, to: [lead.id] }) }) }),
    ).toBe("VALIDATION");
    const free = unwrap({ result: await set({ input: { id: lead.id, allowedNext: "ANY" } }) });
    expect(free).toMatchObject({ restrictsNext: false });
    expect(free.transitionsTo).toHaveLength(3);
    expect(await context.db.orderStatusTransition.count({ where: { fromStatusId: lead.id } })).toBe(
      0,
    );
  });

  it("imports a template next to existing statuses, keeps the entry status, idempotently", async () => {
    const context = await provisionedContext();
    const first = unwrap({
      result: await execute({
        operation: importOrderStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(first.created.map((orderStatus) => orderStatus.name)).toEqual([
      "New",
      "Site visit",
      "Quote sent",
      "Final count locked",
      "Cancelled",
    ]);
    expect(first.skipped).toEqual(["Confirmed", "Completed", "Lost"]);
    const entries = (await statuses({ context })).filter((orderStatus) => orderStatus.entry);
    expect(entries.map((orderStatus) => orderStatus.name)).toEqual(["Lead"]);
    const second = unwrap({
      result: await execute({
        operation: importOrderStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(second).toMatchObject({ created: [], gatesAdded: 0 });
  });

  it("imports into an empty organization and audits statuses and the board they land on", async () => {
    const context = testContext();
    const result = unwrap({
      result: await execute({
        operation: importOrderStatusTemplate,
        input: conferenceEstate,
        context,
      }),
    });
    expect(result.created).toHaveLength(8);
    expect(result.created[0]).toMatchObject({ name: "New", entry: true });
    expect(result.gatesAdded).toBe(6);
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "orderStatus.importTemplate" },
    });
    // Each new status also lands on the default board (ADR 0067), audited on that board.
    expect(new Set(audit.map((row) => row.entityType))).toEqual(new Set(["orderStatus", "board"]));
    expect(audit.length).toBeGreaterThanOrEqual(5);
  });
});
