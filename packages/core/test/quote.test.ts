import { describe, expect, it } from "vitest";
import { execute, getQuote, listQuotes, updateItem, updateLine, updateQuote } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";
import { createTestTicket, moveToPhase } from "./ticket-helpers";

describe("quote.create (ADR 0022, 0052)", () => {
  it("shows the ticket's priced lines live, sums the totals and stores no lines", async () => {
    const { context, ticket, lineType, lunch, coffee, unpriced, gluten } = await quoteSetup();
    const lines = [
      { itemId: lunch.id },
      { itemId: coffee.id, name: "Coffee", unitPriceMinor: 3_500, discountPercent: 10 },
      { itemId: unpriced.id, name: "Surprise" },
    ];
    const [lunchLine] = await addTestLines({
      ...{ context, ticketId: ticket.id, lineTypeId: lineType.id, lines },
    });
    const quote = await createTestQuote({ context, ticketId: ticket.id, terms: "Net 30" });
    expect(quote).toMatchObject({
      version: 1,
      previousId: null,
      quoteStatus: "DRAFT",
      terms: "Net 30",
      totalExclVatMinor: 563_000,
      totalInclVatMinor: 630_560,
      removedLines: [],
      differsFromTicket: null,
    });
    expect(quote.lines).toHaveLength(2);
    expect(quote.lines[0]).toMatchObject({
      lineId: lunchLine?.id,
      name: "Lunch",
      quantity: 20,
      unitPriceMinor: 25_000,
      priceUnit: "PER_PERSON",
      vatRatePercent: 12,
      tags: [{ valueId: gluten, name: "Gluten" }],
      change: null,
    });
    expect(quote.lines[1]).toMatchObject({ unitPriceMinor: 3_500, totalExclVatMinor: 63_000 });
    const again = await execute({ operation: getQuote, input: { id: quote.id }, context });
    expect(unwrap({ result: again })).toEqual(quote);
    expect(await context.db.orderLine.count({ where: { quoteId: quote.id } })).toBe(0);
  });

  it("follows the lines and the items while it is a draft", async () => {
    const { context, ticket, lineType, lunch } = await quoteSetup();
    const lines = [{ itemId: lunch.id }];
    const [line] = await addTestLines({
      context,
      ticketId: ticket.id,
      lineTypeId: lineType.id,
      lines,
    });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    const item = { id: lunch.id, priceMinor: 30_000 };
    unwrap({ result: await execute({ operation: updateItem, input: item, context }) });
    const input = { id: line?.id ?? "", quantity: 12 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    const live = unwrap({
      result: await execute({ operation: getQuote, input: { id: quote.id }, context }),
    });
    expect(live.lines[0]).toMatchObject({ unitPriceMinor: 30_000, quantity: 12 });
    expect(live.totalExclVatMinor).toBe(360_000);
  });

  it("refuses a missing quote, a second quote and a closed ticket", async () => {
    const { context, ticket, type, customer } = await quoteSetup();
    const missing = await execute({ operation: updateQuote, input: { id: "missing" }, context });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
    await createTestQuote({ context, ticketId: ticket.id });
    const second = await createTestQuote({ context, ticketId: ticket.id }).catch((e) => e);
    expect(second.code).toBe("CONFLICT");
    const other = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const lost = { context, ticketId: other.id, name: "Lost", reason: "Too expensive" };
    unwrap({ result: await moveToPhase(lost) });
    const closed = await createTestQuote({ context, ticketId: other.id }).catch((e) => e);
    expect(closed.code).toBe("CONFLICT");
  });

  it("is invisible to other organizations", async () => {
    const { context, ticket } = await quoteSetup();
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    const outsider = await testOrg();
    const read = await execute({ operation: getQuote, input: { id: quote.id }, context: outsider });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const list = unwrap({
      result: await execute({ operation: listQuotes, input: {}, context: outsider }),
    });
    expect(list.items).toEqual([]);
    const forged = await createTestQuote({ context: outsider, ticketId: ticket.id }).catch(
      (e) => e,
    );
    expect(forged.code).toBe("NOT_FOUND");
  });
});
