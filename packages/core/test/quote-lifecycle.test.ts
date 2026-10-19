import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  declineQuote,
  execute,
  expireQuote,
  getQuote,
  getTicket,
  sendQuote,
  updateQuote,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestLines, createTestQuote, draftQuote as draft, quoteSetup } from "./quote-helpers";
import { createTestTicket, moveToPhase } from "./ticket-helpers";

describe("quote.send (ADR 0022)", () => {
  it("needs lines and a future validity, then sends without moving the ticket", async () => {
    const { context, ticket, quote, type, customer } = await draft();
    const { id } = quote;
    const past = new Date(Date.now() - 1000);
    unwrap({
      result: await execute({ operation: updateQuote, input: { id, validUntil: past }, context }),
    });
    const expired = await execute({ operation: sendQuote, input: { id }, context });
    expect(errorCode({ result: expired })).toBe("VALIDATION");
    const bare = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const empty = await createTestQuote({ context, ticketId: bare.id });
    expect(empty.totalInclVatMinor).toBe(0);
    const noLines = await execute({ operation: sendQuote, input: { id: empty.id }, context });
    expect(errorCode({ result: noLines })).toBe("VALIDATION");
    const validUntil = new Date(Date.now() + 86_400_000);
    unwrap({
      result: await execute({ operation: updateQuote, input: { id, validUntil }, context }),
    });
    const sent = unwrap({
      result: await execute({ operation: sendQuote, input: { id }, context }),
    });
    expect(sent).toMatchObject({ quoteStatus: "SENT" });
    const after = unwrap({
      result: await execute({ operation: getTicket, input: { id: ticket.id }, context }),
    });
    expect(after.phaseId).toBe(ticket.phaseId);
    const twice = await execute({ operation: sendQuote, input: { id }, context });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const edit = await execute({ operation: updateQuote, input: { id, terms: "x" }, context });
    expect(errorCode({ result: edit })).toBe("CONFLICT");
    const audit = await getDb().auditLog.findMany({ where: { entityId: ticket.id } });
    expect(audit.find((row) => row.operation === "quote.send")).toBeUndefined();
  });

  it("refuses a ticket in a terminal phase and rolls everything back", async () => {
    const { context, type, customer, lunch, lineType } = await quoteSetup();
    const fresh = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const lines = [{ itemId: lunch.id, quantity: 1 }];
    await addTestLines({ context, ticketId: fresh.id, lineTypeId: lineType.id, lines });
    const quote = await createTestQuote({ context, ticketId: fresh.id });
    const lost = { context, ticketId: fresh.id, name: "Lost", reason: "Price" };
    unwrap({ result: await moveToPhase(lost) });
    const sent = await execute({ operation: sendQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: sent })).toBe("CONFLICT");
    const kept = unwrap({
      result: await execute({ operation: getQuote, input: { id: quote.id }, context }),
    });
    expect(kept.quoteStatus).toBe("DRAFT");
  });
});

describe("quote.decline and quote.expire (ADR 0022)", () => {
  it("close only a SENT quote", async () => {
    const { context, quote } = await draft();
    const { id } = quote;
    for (const operation of [declineQuote, expireQuote]) {
      const early = await execute({ operation, input: { id }, context });
      expect(errorCode({ result: early })).toBe("CONFLICT");
    }
    unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });
    const declined = unwrap({
      result: await execute({ operation: declineQuote, input: { id }, context }),
    });
    expect(declined.quoteStatus).toBe("DECLINED");
    const late = await execute({ operation: expireQuote, input: { id }, context });
    expect(errorCode({ result: late })).toBe("CONFLICT");
  });
});
