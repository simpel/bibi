import { describe, expect, it } from "vitest";
import { type ExecuteContext, execute, generateSheet, sendSheet } from "../src/index";
import { calendarSetup } from "./calendar-range-helpers";
import { AT_SETUP_DAY, summary, summaryAt } from "./dashboard-helpers";
import { unwrap } from "./helpers";
import { halfPaidLateInvoice } from "./late-invoice-helpers";
import { sheetSetup } from "./sheet-helpers";

const DAY_MS = 86_400_000;

type HoldsInput = { context: ExecuteContext; ticketId: string; stateId: string; days: number };

/** Makes the line's state expire and the ticket's holds run out `days` after the clock. */
async function expireIn({ context, ticketId, stateId, days }: HoldsInput) {
  await context.db.itemState.update({ where: { id: stateId }, data: { expires: true } });
  const holdsUntil = new Date(AT_SETUP_DAY.getTime() + days * DAY_MS);
  await context.db.ticket.update({ where: { id: ticketId }, data: { holdsUntil } });
}

describe("dashboard.summary attention (ADR 0080)", () => {
  it("lists holds expiring within 7 days and leaves later ones out", async () => {
    const { context, line } = await calendarSetup();
    const stateId = line.stateId ?? "";
    await expireIn({ context, ticketId: line.ticketId, stateId, days: 3 });
    const soon = unwrap({ result: await summaryAt({ context }) }).attention.expiringHolds;
    expect(soon).toEqual([expect.objectContaining({ ticketId: line.ticketId, lines: 1 })]);
    await expireIn({ context, ticketId: line.ticketId, stateId, days: 10 });
    const later = unwrap({ result: await summaryAt({ context }) }).attention.expiringHolds;
    expect(later).toEqual([]);
  });

  it("lists the newest sheet version until it is sent", async () => {
    const setup = await sheetSetup();
    const { context, ticket, definition } = setup;
    const input = { ticketId: ticket.id, sheetDefinitionId: definition.id };
    const sheet = unwrap({ result: await execute({ operation: generateSheet, input, context }) });
    const before = unwrap({ result: await summaryAt({ context }) }).attention.unsentSheets;
    expect(before).toEqual([
      expect.objectContaining({ sheetId: sheet.id, name: "Kitchen order", version: 1 }),
    ]);
    unwrap({ result: await execute({ operation: sendSheet, input: { id: sheet.id }, context }) });
    const after = unwrap({ result: await summaryAt({ context }) }).attention.unsentSheets;
    expect(after).toEqual([]);
  });

  it("counts overdue invoices with what is open on them", async () => {
    const { context } = await halfPaidLateInvoice();
    const { overdue } = unwrap({ result: await summary({ context }) }).attention;
    expect(overdue).toEqual({ invoices: 1, totalMinor: 380_000 });
  });
});
