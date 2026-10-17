import { describe, expect, it } from "vitest";
import {
  execute,
  getQuote,
  listQuotes,
  markInquiryLost,
  updateItem,
  updateQuote,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestInquiry } from "./inquiry-helpers";
import { testOrg } from "./org-helpers";
import { createTestQuote, quoteSetup } from "./quote-helpers";

describe("quote.create (ADR 0022)", () => {
  it("snapshots the items into lines, sums the totals and inherits the salesperson", async () => {
    const { context, inquiry, lunch, coffee, gluten } = await quoteSetup();
    const lines = [
      { itemId: lunch.id, quantity: 20 },
      { itemId: coffee.id, quantity: 20, unitPriceMinor: 3_500, discountPercent: 10 },
    ];
    const quote = await createTestQuote({ context, inquiryId: inquiry.id, lines, terms: "Net 30" });
    expect(quote).toMatchObject({
      version: 1,
      previousId: null,
      quoteStatus: "DRAFT",
      terms: "Net 30",
      totalExclVatMinor: 563_000,
      totalInclVatMinor: 630_560,
      removedLines: [],
    });
    expect(quote.lines[0]).toMatchObject({
      name: "Lunch",
      unitPriceMinor: 25_000,
      priceUnit: "PER_PERSON",
      vatRatePercent: 12,
      tags: [{ valueId: gluten, name: "Gluten" }],
      change: null,
    });
    expect(quote.lines[1]).toMatchObject({ unitPriceMinor: 3_500, totalExclVatMinor: 63_000 });
    const again = await execute({
      operation: getQuote,
      input: { id: quote.id },
      context,
    });
    expect(unwrap({ result: again })).toEqual(quote);
  });

  it("keeps the snapshot when the item changes afterwards", async () => {
    const { context, inquiry, lunch } = await quoteSetup();
    const lines = [{ itemId: lunch.id, quantity: 10 }];
    const quote = await createTestQuote({ context, inquiryId: inquiry.id, lines });
    const input = { id: lunch.id, name: "Big lunch", priceMinor: 30_000 };
    unwrap({ result: await execute({ operation: updateItem, input, context }) });
    const kept = await execute({
      operation: updateQuote,
      input: {
        id: quote.id,
        lines: [{ lineId: quote.lines[0]?.id, itemId: lunch.id, quantity: 12 }],
      },
      context,
    });
    expect(unwrap({ result: kept }).lines[0]).toMatchObject({
      name: "Lunch",
      unitPriceMinor: 25_000,
      quantity: 12,
    });
    const fresh = await execute({
      operation: updateQuote,
      input: { id: quote.id, lines: [{ itemId: lunch.id, quantity: 12 }] },
      context,
    });
    expect(unwrap({ result: fresh }).lines[0]).toMatchObject({
      name: "Big lunch",
      unitPriceMinor: 30_000,
    });
  });

  it("refuses bad lines, a second quote and a closed inquiry", async () => {
    const { context, inquiry, unpriced, type, customer } = await quoteSetup();
    const missing = await execute({ operation: updateQuote, input: { id: "missing" }, context });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
    await createTestQuote({ context, inquiryId: inquiry.id });
    const second = await createTestQuote({ context, inquiryId: inquiry.id }).catch((e) => e);
    expect(second.code).toBe("CONFLICT");
    const other = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const lines = [{ itemId: unpriced.id, quantity: 1 }];
    const unpricedLine = await createTestQuote({ context, inquiryId: other.id, lines }).catch(
      (e) => e,
    );
    expect(unpricedLine).toMatchObject({ code: "VALIDATION" });
    expect(unpricedLine.issues[0].path).toBe("lines.0.unitPriceMinor");
    const unknown = await createTestQuote({
      context,
      inquiryId: other.id,
      lines: [{ itemId: "nope", quantity: 1 }],
    }).catch((e) => e);
    expect(unknown.issues[0].path).toBe("lines.0.itemId");
    const input = { id: other.id, lossReason: "Too expensive" };
    unwrap({ result: await execute({ operation: markInquiryLost, input, context }) });
    const closed = await createTestQuote({ context, inquiryId: other.id }).catch((e) => e);
    expect(closed.code).toBe("CONFLICT");
  });

  it("is invisible to other organizations", async () => {
    const { context, inquiry } = await quoteSetup();
    const quote = await createTestQuote({ context, inquiryId: inquiry.id });
    const outsider = await testOrg();
    const read = await execute({ operation: getQuote, input: { id: quote.id }, context: outsider });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const list = unwrap({
      result: await execute({ operation: listQuotes, input: {}, context: outsider }),
    });
    expect(list.items).toEqual([]);
    const forged = await createTestQuote({ context: outsider, inquiryId: inquiry.id }).catch(
      (e) => e,
    );
    expect(forged.code).toBe("NOT_FOUND");
  });
});
