import { describe, expect, it } from "vitest";
import { dashboardSummary, type ExecuteContext, execute, updateTicket } from "../src/index";
import { calendarSetup } from "./calendar-range-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestLines, quoteSetup } from "./quote-helpers";
import { sentTestQuote } from "./receivable-helpers";
import { createTestTicket, placeInStatus } from "./ticket-helpers";
import { statuses } from "./ticket-status-helpers";

const WIDE = { from: "2020-01-01", to: "2021-12-31" };
const NOW_ISH = () => {
  const year = new Date().getUTCFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

const summary = async ({ context, input }: { context: ExecuteContext; input: object }) =>
  execute({ operation: dashboardSummary, input, context });

describe("dashboard.summary (ADR 0079)", () => {
  it("counts open tickets per status with their estimated value", async () => {
    const { context, ticket } = await quoteSetup();
    const estimate = { id: ticket.id, estimatedValueMinor: 650_000 };
    unwrap({ result: await execute({ operation: updateTicket, input: estimate, context }) });
    const { statuses: tiles } = unwrap({ result: await summary({ context, input: WIDE }) });
    const tile = tiles.find((candidate) => candidate.statusId === ticket.statusId);
    expect(tile).toMatchObject({ tickets: 1, estimatedValueMinor: 650_000 });
    expect(tile?.confirmedValueMinor).toBeNull();
    expect(tiles.every((candidate) => candidate.tickets === 0 || candidate === tile)).toBe(true);
  });

  it("splits closed tickets into won (accepted quote) and lost, by month and value", async () => {
    const { context, ticket, lineType, lunch, customer, type } = await quoteSetup();
    const closing = (await statuses({ context })).find((status) => status.closes);
    if (!closing) throw new Error("No closing status");
    const lines = [{ itemId: lunch.id }];
    await addTestLines({ context, ticketId: ticket.id, lineTypeId: lineType.id, lines });
    await sentTestQuote({ context, ticketId: ticket.id, accept: true });
    const lost = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const estimate = { id: lost.id, estimatedValueMinor: 300_000 };
    unwrap({ result: await execute({ operation: updateTicket, input: estimate, context }) });
    const current = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    await placeInStatus({ ticket: current, statusId: closing.id });
    await placeInStatus({ ticket: lost, statusId: closing.id });
    const { outcomes } = unwrap({ result: await summary({ context, input: NOW_ISH() }) });
    const total = ({
      key,
    }: {
      key: "wonTickets" | "wonValueMinor" | "lostTickets" | "lostValueMinor";
    }) => (outcomes ?? []).reduce((sum, row) => sum + row[key], 0);
    expect(total({ key: "wonTickets" })).toBe(1);
    expect(total({ key: "wonValueMinor" })).toBeGreaterThan(0);
    expect(total({ key: "lostTickets" })).toBe(1);
    expect(total({ key: "lostValueMinor" })).toBe(300_000);
  });

  it("hides outcomes without quote:read and utilisation without item:read", async () => {
    const { context } = await quoteSetup();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    const value = unwrap({ result: await summary({ context: reader, input: WIDE }) });
    expect(value.outcomes).toBeNull();
    expect(value.utilisation).toBeNull();
    const nobody = testContext({ organizationId: context.organizationId, permissions: {} });
    expect(errorCode({ result: await summary({ context: nobody, input: WIDE }) })).toBe(
      "FORBIDDEN",
    );
  });

  it("measures utilisation as hold time inside open hours, overlaps counted once", async () => {
    const { context } = await calendarSetup();
    const input = { from: "2037-11-01", to: "2037-11-01" };
    const { utilisation } = unwrap({ result: await summary({ context, input }) });
    // The office day is 08–18 local (07–17 UTC): holds 09–11 and 13–14 UTC are 180 of 600 minutes.
    expect(utilisation).toEqual([
      expect.objectContaining({ items: 1, bookedMinutes: 180, openMinutes: 600, rate: 0.3 }),
    ]);
  });

  it("refuses a period that ends before it starts", async () => {
    const { context } = await quoteSetup();
    const input = { from: "2026-02-01", to: "2026-01-01" };
    expect(errorCode({ result: await summary({ context, input }) })).toBe("VALIDATION");
  });
});
