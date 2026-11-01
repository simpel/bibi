import { describe, expect, it } from "vitest";
import { execute, updateTicket } from "../src/index";
import { calendarSetup } from "./calendar-range-helpers";
import { summary, summaryAt } from "./dashboard-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { quoteSetup } from "./quote-helpers";
import { moneySetup, sentTestQuote } from "./receivable-helpers";

describe("dashboard.summary (ADR 0079, 0080)", () => {
  it("counts open tickets per status with their estimated value", async () => {
    const { context, ticket } = await quoteSetup();
    const estimate = { id: ticket.id, estimatedValueMinor: 650_000 };
    unwrap({ result: await execute({ operation: updateTicket, input: estimate, context }) });
    const { statuses: tiles } = unwrap({ result: await summary({ context }) });
    const tile = tiles.find((candidate) => candidate.statusId === ticket.statusId);
    expect(tile).toMatchObject({ tickets: 1, estimatedValueMinor: 650_000 });
    expect(tile?.confirmedValueMinor).toBeNull();
    expect(tiles.every((candidate) => candidate.tickets === 0 || candidate === tile)).toBe(true);
  });

  it("covers today and the next 27 days in the organization's zone", async () => {
    const { context } = await calendarSetup();
    const value = unwrap({ result: await summaryAt({ context }) });
    expect([value.from, value.to]).toEqual(["2037-11-01", "2037-11-28"]);
  });

  it("lists the tickets coming up and measures utilisation over the horizon", async () => {
    const { context, line } = await calendarSetup();
    const { comingUp, utilisation } = unwrap({ result: await summaryAt({ context }) });
    expect(comingUp).toEqual([
      expect.objectContaining({ ticketId: line.ticketId, lines: 1, startsAt: line.startsAt }),
    ]);
    // The office day is 08–18 local (07–17 UTC): holds 09–11 and 13–14 UTC are 180 minutes.
    expect(utilisation).toEqual([expect.objectContaining({ items: 1, bookedMinutes: 180 })]);
    expect(utilisation?.[0]?.openMinutes).toBeGreaterThan(600);
  });

  it("counts an accepted quote as booked ahead until the ticket is invoiced", async () => {
    const { context, ticket } = await moneySetup();
    const { bookedAhead: before } = unwrap({ result: await summary({ context }) });
    expect(before).toEqual([]);
    await sentTestQuote({ context, ticketId: ticket.id, accept: true });
    const { bookedAhead } = unwrap({ result: await summary({ context }) });
    expect(bookedAhead).toEqual([
      expect.objectContaining({ valueExclVatMinor: 500_000, tickets: 1 }),
    ]);
  });

  it("hides each part the caller may not read", async () => {
    const { context } = await calendarSetup();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    const value = unwrap({ result: await summaryAt({ context: reader }) });
    expect(value.utilisation).toBeNull();
    expect(value.bookedAhead).toBeNull();
    expect(value.attention.unsentSheets).toBeNull();
    expect(value.attention.overdue).toBeNull();
    expect(value.comingUp[0]?.customerName).toBeNull();
    const nobody = testContext({ organizationId: context.organizationId, permissions: {} });
    expect(errorCode({ result: await summary({ context: nobody }) })).toBe("FORBIDDEN");
  });
});
