import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  execute,
  importBookingStatusTemplate,
  reorderBookingStatuses,
  setBookingStatusTransitions,
} from "../src/index";
import { provisionedContext, statusByName, statuses } from "./booking-status-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

const conferenceVenue = { template: "conference-venue" };

describe("booking status order, transitions and templates (ADR 0022)", () => {
  it("reorders within a phase but keeps phases in lifecycle order", async () => {
    const context = await provisionedContext();
    unwrap({
      result: await execute({
        operation: importBookingStatusTemplate,
        input: conferenceVenue,
        context,
      }),
    });
    const ids = (await statuses({ context })).map((status) => status.id);
    const [tentative, confirmed, locked, completed, cancelled] = ids;
    const swapped = [tentative, locked, confirmed, completed, cancelled];
    const result = unwrap({
      result: await execute({
        operation: reorderBookingStatuses,
        input: { ids: swapped },
        context,
      }),
    });
    expect(result.items.map((status) => status.id)).toEqual(swapped);
    const mixed = [confirmed, tentative, locked, completed, cancelled];
    const refused = await execute({
      operation: reorderBookingStatuses,
      input: { ids: mixed },
      context,
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const partial = await execute({
      operation: reorderBookingStatuses,
      input: { ids: ids.slice(1) },
      context,
    });
    expect(errorCode({ result: partial })).toBe("VALIDATION");
  });

  it("replaces a status's transitions as a set and refuses self and unknown targets", async () => {
    const context = await provisionedContext();
    const tentative = await statusByName({ context, name: "Tentative" });
    const completed = await statusByName({ context, name: "Completed" });
    const input = { id: tentative.id, toStatusIds: [completed.id] };
    const set = unwrap({
      result: await execute({ operation: setBookingStatusTransitions, input, context }),
    });
    expect(set.transitionsTo).toEqual([completed.id]);
    const self = { id: tentative.id, toStatusIds: [tentative.id] };
    const selfResult = await execute({
      operation: setBookingStatusTransitions,
      input: self,
      context,
    });
    expect(errorCode({ result: selfResult })).toBe("VALIDATION");
    const foreign = await statusByName({ context: await provisionedContext(), name: "Confirmed" });
    const cross = { id: tentative.id, toStatusIds: [foreign.id] };
    const crossResult = await execute({
      operation: setBookingStatusTransitions,
      input: cross,
      context,
    });
    expect(errorCode({ result: crossResult })).toBe("VALIDATION");
    const cleared = { id: tentative.id, toStatusIds: [] };
    unwrap({
      result: await execute({ operation: setBookingStatusTransitions, input: cleared, context }),
    });
    expect((await statusByName({ context, name: "Tentative" })).transitionsTo).toEqual([]);
  });

  it("imports the conference venue template into a new organization, idempotently", async () => {
    const context = await provisionedContext();
    const first = unwrap({
      result: await execute({
        operation: importBookingStatusTemplate,
        input: conferenceVenue,
        context,
      }),
    });
    expect(first.created.map((status) => status.name)).toEqual(["Final count locked"]);
    expect(first.skipped).toEqual(["Tentative", "Confirmed", "Completed", "Cancelled"]);
    const all = await statuses({ context });
    const id = Object.fromEntries(all.map((status) => [status.name, status.id]));
    expect(all.map((status) => status.name)).toEqual([
      "Tentative",
      "Confirmed",
      "Final count locked",
      "Completed",
      "Cancelled",
    ]);
    const confirmed = all.find((status) => status.name === "Confirmed");
    expect(confirmed?.transitionsTo).toEqual([
      id["Final count locked"],
      id.Completed,
      id.Cancelled,
    ]);
    expect(all.find((status) => status.name === "Completed")?.transitionsTo).toEqual([]);
    const second = unwrap({
      result: await execute({
        operation: importBookingStatusTemplate,
        input: conferenceVenue,
        context,
      }),
    });
    expect(second).toMatchObject({ created: [], transitionsAdded: 0 });
  });

  it("imports into an empty organization and audits every change as a bookingStatus", async () => {
    const context = testContext();
    const result = unwrap({
      result: await execute({
        operation: importBookingStatusTemplate,
        input: conferenceVenue,
        context,
      }),
    });
    expect(result.created).toHaveLength(5);
    expect(result.transitionsAdded).toBe(9);
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "bookingStatus.importTemplate" },
    });
    expect(new Set(audit.map((row) => row.entityType))).toEqual(new Set(["bookingStatus"]));
    expect(audit.length).toBeGreaterThanOrEqual(5);
  });
});
