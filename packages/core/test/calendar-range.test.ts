import { describe, expect, it } from "vitest";
import { createOccupancy, createVenue, execute } from "../src/index";
import { calendarSetup, range, runRange } from "./calendar-range-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

const DAY = { from: "2026-11-01", to: "2026-11-01" };

describe("calendar.range (ADR 0064)", () => {
  it("joins each block with its line, ticket, state and status, earliest first", async () => {
    const { context, line, manual } = await calendarSetup();
    const ticket = await context.db.ticket.findFirstOrThrow({ where: { id: line.ticketId } });
    const state = await context.db.itemState.findFirstOrThrow({
      where: { id: line.stateId ?? "" },
    });
    const result = await range({ context, input: DAY });
    expect(result.timeZone).toBe("Europe/Stockholm");
    expect(result.from).toEqual(new Date("2026-10-31T23:00:00Z"));
    expect(result.to).toEqual(new Date("2026-11-01T23:00:00Z"));
    expect(result.blocks).toEqual([
      expect.objectContaining({
        type: "HOLD",
        ticketId: line.ticketId,
        reference: ticket.reference,
        title: line.name,
        soft: false,
        stateId: line.stateId,
        stateName: state.name,
        statusId: ticket.statusId,
      }),
      expect.objectContaining({
        id: manual.id,
        type: "MAINTENANCE",
        ticketId: null,
        title: "Floor polish",
        stateId: null,
      }),
    ]);
  });

  it("resolves days in the zone, so a day can be 25 hours long", async () => {
    const { context } = await calendarSetup();
    // Summer time ends on 25 October 2026 in Stockholm.
    const result = await range({ context, input: { from: "2026-10-25", to: "2026-10-25" } });
    expect(result.to.getTime() - result.from.getTime()).toBe(25 * 3_600_000);
    // Summer time starts on 29 March 2026.
    const spring = await range({ context, input: { from: "2026-03-29", to: "2026-03-29" } });
    expect(spring.to.getTime() - spring.from.getTime()).toBe(23 * 3_600_000);
    expect(result.blocks).toEqual([]);
  });

  it("narrows by ticket, state, status and type; line filters hide manual blocks", async () => {
    const { context, line, item } = await calendarSetup();
    const ticket = await context.db.ticket.findFirstOrThrow({ where: { id: line.ticketId } });
    for (const filter of [
      { ticketId: line.ticketId },
      { stateId: line.stateId },
      { statusId: ticket.statusId },
    ]) {
      const { blocks } = await range({ context, input: { ...DAY, ...filter } });
      expect(blocks.map((block) => block.type)).toEqual(["HOLD"]);
    }
    const typed = await range({ context, input: { ...DAY, typeId: item.entityTypeId } });
    expect(typed.blocks).toHaveLength(2);
  });

  it("filters by venue and reads the venue's zone", async () => {
    const { context, item } = await calendarSetup();
    const venueInput = { name: "Gate", timeZone: "Europe/London" };
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: venueInput, context }),
    });
    const other = await createTestItem({
      context,
      entityTypeId: item.entityTypeId,
      name: "Garden",
      venueId: venue.id,
    });
    const at = {
      startsAt: new Date("2026-11-01T10:00:00Z"),
      endsAt: new Date("2026-11-01T12:00:00Z"),
    };
    unwrap({
      result: await execute({
        operation: createOccupancy,
        input: { itemId: other.id, type: "INTERNAL", ...at },
        context,
      }),
    });
    const result = await range({ context, input: { ...DAY, venueId: venue.id } });
    expect(result.timeZone).toBe("Europe/London");
    expect(result.from).toEqual(new Date("2026-11-01T00:00:00Z"));
    expect(result.blocks.map((block) => block.itemId)).toEqual([other.id]);
    await context.db.venue.update({ where: { id: venue.id }, data: { status: "ARCHIVED" } });
    const archived = await range({ context, input: { ...DAY, venueId: venue.id } });
    expect(archived.timeZone).toBe("Europe/London");
  });

  it("rejects a reversed, too long or malformed range", async () => {
    const { context } = await calendarSetup();
    for (const input of [
      { from: "2026-11-02", to: "2026-11-01" },
      { from: "2026-11-01", to: "2027-01-02" },
      { from: "2026-02-30", to: "2026-03-01" },
    ]) {
      expect(errorCode({ result: await runRange({ context, input }) })).toBe("VALIDATION");
    }
    const longest = await range({ context, input: { from: "2026-11-01", to: "2027-01-01" } });
    expect(longest.blocks).toHaveLength(2);
  });

  it("hides the line's name and the state's name without program and pipeline read", async () => {
    const { context } = await calendarSetup();
    const reader = { ...context, permissions: { ticket: ["read" as const] } };
    const { blocks } = await range({ context: reader, input: DAY });
    expect(blocks[0]).toMatchObject({
      title: null,
      heldAt: null,
      stateName: null,
      stateColor: null,
    });
    expect(blocks[0]?.stateId).not.toBeNull();
    expect(blocks[1]).toMatchObject({ title: "Floor polish" });
  });

  it("answers NOT_FOUND for a venue or ticket out of reach", async () => {
    const { context } = await calendarSetup();
    for (const filter of [{ venueId: "missing" }, { ticketId: "missing" }]) {
      const result = await runRange({ context, input: { ...DAY, ...filter } });
      expect(errorCode({ result })).toBe("NOT_FOUND");
    }
  });
});
