import { describe, expect, it } from "vitest";
import { effectiveVat } from "../src/features/line/effective-values";
import { createLine, execute, listLines, updateLine } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";
import { hours } from "./occupancy-helpers";

describe("untimed lines (ADR 0052)", () => {
  it("creates a line without times that holds nothing and is left out of time windows", async () => {
    const { context, ticket, type, room } = await programSetup();
    const input = { ticketId: ticket.id, entityTypeId: type.id, name: "Parking", itemId: room.id };
    const line = unwrap({ result: await execute({ operation: createLine, input, context }) });
    expect(line).toMatchObject({ startsAt: null, endsAt: null });
    expect(await activeOccupancies({ context, sourceId: line.id })).toEqual([]);
    const window = { ticketId: ticket.id, ...{ from: hours({ from: 0, to: 23 }).startsAt } };
    const page = unwrap({
      result: await execute({ operation: listLines, input: window, context }),
    });
    expect(page.items.map(({ id }) => id)).not.toContain(line.id);
    const all = unwrap({
      result: await execute({ operation: listLines, input: { ticketId: ticket.id }, context }),
    });
    expect(all.items.map(({ id }) => id)).toContain(line.id);
  });

  it("refuses a start without an end", async () => {
    const { context, ticket, type } = await programSetup();
    const input = {
      ...{ ticketId: ticket.id, entityTypeId: type.id, name: "Half" },
      startsAt: hours({ from: 10, to: 11 }).startsAt,
    };
    expect(errorCode({ result: await execute({ operation: createLine, input, context }) })).toBe(
      "VALIDATION",
    );
  });

  it("releases the hold when a timed line becomes untimed, and holds again when timed", async () => {
    const { context, ticket, type, room } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const line = unwrap({ result: await createTestLine({ ...base, from: 10, to: 12 }) });
    expect(await activeOccupancies({ context, sourceId: line.id })).toHaveLength(1);
    const untimed = { id: line.id, startsAt: null, endsAt: null };
    unwrap({ result: await execute({ operation: updateLine, input: untimed, context }) });
    expect(await activeOccupancies({ context, sourceId: line.id })).toEqual([]);
    const timed = { id: line.id, ...hours({ from: 13, to: 14 }) };
    unwrap({ result: await execute({ operation: updateLine, input: timed, context }) });
    expect(await activeOccupancies({ context, sourceId: line.id })).toHaveLength(1);
  });
});

describe("effective VAT (ADR 0052)", () => {
  it("falls back from the line to the item to the venue's default", () => {
    const item = { vatRatePercent: null, venueVatRatePercent: 25 };
    expect(effectiveVat({ line: { vatRatePercent: null }, item })).toEqual({
      value: 25,
      source: "VENUE",
    });
    expect(effectiveVat({ line: { vatRatePercent: 6 }, item }).source).toBe("LINE");
    expect(effectiveVat({ line: { vatRatePercent: null }, item: null }).value).toBeNull();
  });
});
